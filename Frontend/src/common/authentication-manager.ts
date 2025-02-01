import { IAuthenticationManager, IAuthenticator, IAuthenticatorState, AuthenticationManagerStateType, IFrameworkIntegration, AuthenticationMethodType } from "./authentication";
import { SpaConfiguration } from "../api/app";
import { PasswordAuthenticator, IPasswordAuthenticatorState } from "./password-authenticator";
import { AzureAdAuthenticator, IAzureAdAuthenticatorState } from "./azure-ad-authenticator";

const cAuthManagerState = "authManagerState";

export class AuthenticationManager implements IAuthenticationManager {
  public authenticator: IAuthenticator | null = null;
  public allAuthenticators: IAuthenticator[] = [];
  private state: AuthenticationManagerStateType = AuthenticationManagerStateType.Initializing;
  private framework: IFrameworkIntegration | null = null;

  constructor(private authMethods: AuthenticationMethodType[], private spaConfig: SpaConfiguration) {
    this.startAuthentication = this.startAuthentication.bind(this);
    this.stop = this.stop.bind(this);
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.configureFramework = this.configureFramework.bind(this);
    this.logout = this.logout.bind(this);
    this.onAuthManagerStateChange = this.onAuthManagerStateChange.bind(this);
    this.setAccessTokenReady = this.setAccessTokenReady.bind(this);
    this.getAuthenticator = this.getAuthenticator.bind(this);
  }

  public getAuthenticator<T extends IAuthenticator>(authMethod: AuthenticationMethodType | null): T | null {
    let authTypeOf: InstanceType<new (...args: any[]) => any>;

    if (authMethod == null) authTypeOf = null;
    else if (authMethod === AuthenticationMethodType.AzureAd) authTypeOf = AzureAdAuthenticator;
    else if (authMethod === AuthenticationMethodType.Password) authTypeOf = PasswordAuthenticator;
    else throw new Error(`Unable to determine type of authenticator to locate.`);

    for (let i = 0; i < this.allAuthenticators.length; i++) {
      if (this.allAuthenticators[i] instanceof authTypeOf) return (this.allAuthenticators[i] as unknown) as T;
    }

    return null;
  }

  public configureFramework(integration: IFrameworkIntegration | null) {
    this.framework = integration == null ? null : { ...integration };
  }

  public getState(): AuthenticationManagerStateType {
    return this.state;
  }

  public setState(value: AuthenticationManagerStateType) {
    this.state = value;
    this.framework?.setState(value);
  }

  public async startAuthentication(): Promise<void> {
    let authStateStr = localStorage.getItem(cAuthManagerState);
    let authState: IAuthenticatorState | null = authStateStr == null ? null : JSON.parse(authStateStr);
    let isAuthInvalid: boolean | null = null;
    let success: boolean = false;

    window.addEventListener("storage", this.onAuthManagerStateChange);

    if (authState == null) {
      // Anonymous user.  Nothing needs to be initialized.
    } else if (authState.managerType === "PasswordAuthenticator") {
      this.authenticator = new PasswordAuthenticator(authState as IPasswordAuthenticatorState, this);
      if (this.authMethods.indexOf(AuthenticationMethodType.Password) < 0) isAuthInvalid = true;
    } else if (authState.managerType === "AzureAd") {
      this.authenticator = new AzureAdAuthenticator(authState as IAzureAdAuthenticatorState, this.spaConfig, this);
      if (this.authMethods.indexOf(AuthenticationMethodType.AzureAd) < 0) isAuthInvalid = true;
    }

    if (isAuthInvalid) {
      success = false;
      this.setPersistentState(null);
      window.location.reload();
    } else if (this.authenticator != null) {
      success = await this.authenticator.start();
    }

    // Hydrate the list of allAuthenticators.  Only do ones that are actually enabled (even if they aren't the currently active ones).
    this.authMethods.forEach(m => {
      if (m === AuthenticationMethodType.AzureAd) {
        this.allAuthenticators.push(this.authenticator instanceof AzureAdAuthenticator ? this.authenticator : new AzureAdAuthenticator(null, this.spaConfig, this));
      } else if (m === AuthenticationMethodType.Password) {
        this.allAuthenticators.push(this.authenticator instanceof PasswordAuthenticator ? this.authenticator : new PasswordAuthenticator(null, this));
      }
    });

    if (success === false) {
      this.authenticator = null;
    }

    this.setState(AuthenticationManagerStateType.Running);
  }

  public async stop(): Promise<void> {
    window.removeEventListener("storage", this.onAuthManagerStateChange);
  }

  private async onAuthManagerStateChange(event: StorageEvent): Promise<void> {
    if (event.key === cAuthManagerState) {
      let authStateStr = event.newValue;
      let authState: IAuthenticatorState | null = authStateStr == null ? null : JSON.parse(authStateStr);
      await this.authenticator?.externalStateChange(authState);
    }
  }

  public async logout(): Promise<void> {
    return await this.authenticator?.logout();
  }

  public setPersistentState(newState: IAuthenticatorState | null) {
    if (newState == null) localStorage.removeItem(cAuthManagerState);
    else localStorage.setItem(cAuthManagerState, JSON.stringify(newState));
  }

  public setAccessTokenReady(isReady: boolean) {
    this.framework?.setAccessTokenReady(isReady);
  }
}
