import { AuthenticationResult, IPublicClientApplication, PublicClientApplication, AccountInfo } from "@azure/msal-browser";

import { IAuthenticationManager, IAuthenticatorState, IAuthenticator } from "./authentication";
import { Api } from "../api/api";
import { SpaConfiguration } from "../api/app";

/** Use redirect or popup window authentication.  Redirect is more universally usable.  Popup is probably better when operating as a progressive web app. */
const AuthTokenAcquisition: "redirect" | "popup" = "redirect";

export class AzureAdAuthenticator implements IAuthenticator {
  private pca: IPublicClientApplication;
  private initializingPromise: Promise<void> | null = null;
  private initializingPromiseResolver: (() => void) | null = null;
  private initializingPromiseRejector: ((error?: any) => void) | null = null;

  constructor(private state: IAzureAdAuthenticatorState | null, private spaConfig: SpaConfiguration, private authManager: IAuthenticationManager) {
    this.start = this.start.bind(this);
    this.getAccessJwt = this.getAccessJwt.bind(this);
    this.getAccessTokenPassive = this.getAccessTokenPassive.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.externalStateChange = this.externalStateChange.bind(this);

    this.pca = new PublicClientApplication({
      auth: {
        clientId: this.spaConfig.msalClientId,
        authority: this.spaConfig.msalAuthority,
        redirectUri: `${this.spaConfig.url}azure-ad/login`,
        postLogoutRedirectUri: `${this.spaConfig.url}authentication`
      },
      cache: {
        cacheLocation: "localStorage"
      }
    });
  }

  public async getAccessTokenPassive(blockOnInitialization?: boolean | null, account?: AccountInfo | null): Promise<string> {
    // If the instance is still initializing then wait until it's done.
    if (blockOnInitialization !== false && this.initializingPromise != null) await this.initializingPromise;

    if (account == null) {
      account = this.pca.getActiveAccount();
      if (account == null) throw new Error("getActiveAccount() cannot be null.");
    }

    const request = {
      scopes: this.spaConfig.msalScopes,
      account: account
    };
    const result = await this.pca.acquireTokenSilent(request);
    return result.accessToken;
  }

  public async start(): Promise<boolean> {
    // Make all API requests that use an access token block until MSAL has been fully initialized.
    this.initializingPromise = new Promise<void>((resolve, reject) => {
      this.initializingPromiseResolver = resolve;
      this.initializingPromiseRejector = reject;
    }).then(() => {
      // Cleanup.
      this.initializingPromise = null;
      this.initializingPromiseResolver = null;
      this.initializingPromiseRejector = null;
      this.authManager.setAccessTokenReady(true);
    }, (ex) => {
      // Cleanup.
      this.initializingPromise = null;
      this.initializingPromiseResolver = null;
      this.initializingPromiseRejector = null;
      this.authManager.setAccessTokenReady(false);
      if ("message" in ex && typeof ex.message === "string") {
        console.warn(ex);
      }
      //throw ex;
    });

    // Access tokens are short-lived and periodically replaced with a new one by the MSAL library.  So every time we make a call to our internal API we
    // need to get the most recent access token.
    Api.setAccessTokenRenewer(this.getAccessTokenPassive);

    // This is called after the user had to be redirected for authentication.  We don't use a promise or async...await because the redirects cause a page reset.
    if (AuthTokenAcquisition === "redirect") {
      const response = await this.pca.handleRedirectPromise();

      if (response != null) {
        // This happens only immediately after the redirect completes.
        this.pca.setActiveAccount(response.account);
      } else if (this.pca.getActiveAccount() == null) {
        // This happens when the user begins the login process, but aborts part way through the redirect process.
        this.authManager.setPersistentState(null);
        if (this.initializingPromiseRejector != null) this.initializingPromiseRejector(new Error("Azure AD login was aborted by the user before redirect process completed.  Login information purged to clean slate."));
        return false;
      }

      if (this.initializingPromiseResolver != null) this.initializingPromiseResolver();
    }

    return true;
  }

  public async login(isFullLogin: boolean): Promise<AuthenticationResult | null> {
    if (this.initializingPromise != null) await this.initializingPromise;

    let authResult: AuthenticationResult | null = null;

    if (isFullLogin) {
      this.authManager.setPersistentState({
        managerType: "AzureAd"
      });
      await this.pca.loginRedirect({
        scopes: this.spaConfig.msalScopes,
        prompt: "select_account"  // Force the user to select an account.
      });
    } else {
      authResult = await this.pca.loginPopup({
        scopes: this.spaConfig.msalScopes,
        prompt: "select_account"  // Force the user to select an account.
      });
    }

    return authResult;
  }

  /*public async loginForLink(): Promise<{ authenticationResult: AuthenticationResult | null, acccessToken: string | null }> {
    if (this.initializingPromise != null) await this.initializingPromise;

    let authResult: AuthenticationResult | null;
    let accessToken: string | null;

    try {
      authResult = await this.pca.loginPopup({
        scopes: this.spaConfig.msalScopes
      });
      if (authResult.account != null) {
        let acquireResult = await this.pca.acquireTokenSilent({ account: authResult.account, scopes: this.spaConfig.msalScopes });
        accessToken = acquireResult.accessToken;
      }
    } catch {
      
    } finally {

    }
  }*/

  public async logout(): Promise<void> {
    const account = this.pca.getActiveAccount();
    this.authManager.setPersistentState(null);
    this.pca.logout({ account: account });
  }

  public async getAccessJwt(account?: AccountInfo): Promise<string | null> {
    return await this.getAccessTokenPassive();
  }

  public async externalStateChange(newState: IAuthenticatorState | null): Promise<void> {
    if (newState == null || newState.managerType === null) {
      this.state = null;
    }
  }
}

export interface IAzureAdAuthenticatorState extends IAuthenticatorState {
  managerType: "AzureAd";
  refreshToken: string;
  accessToken: string;
}
