import { IAuthenticationManager, IAuthenticatorState, IAuthenticator } from "./authentication";
import { Api } from "../api/api";
import { AuthenticateResponse, RegisterResponse } from "../api/identity";

export class PasswordAuthenticator implements IAuthenticator {
  private cancelRefreshTimer: null | (() => void) = null;

  constructor(private state: IPasswordAuthenticatorState | null, private authManager: IAuthenticationManager) {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.getAccessJwt = this.getAccessJwt.bind(this);
    this.getRefreshJwt = this.getRefreshJwt.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.scheduleRefresh = this.scheduleRefresh.bind(this);
    this.runScheduledRefresh = this.runScheduledRefresh.bind(this);
    this.externalStateChange = this.externalStateChange.bind(this);
  }

  public async start(): Promise<boolean> {
    if (this.state == null) {
      return true;
    } else {
      // Attempt to restore an existing session.
      const raw: { accessToken: string, refreshToken: string } = { accessToken: this.state.accessToken, refreshToken: this.state.refreshToken };
      const accessToken = reviveJwt(raw.accessToken);
      const refreshToken = reviveJwt(raw.refreshToken);
      const now = new Date();

      if (refreshToken.exp.getTime() < now.getTime()) {
        // Previous session has expired.  Delete it and proceed as if it never existed.
        this.authManager.setPersistentState(null);
        return false;
      } else if (accessToken.exp.getTime() < now.getTime()) {
        // The previous access token has expired, but the refresh token is still good.  Get a new set of tokens.
        const newTokens = await Api.identity.generateNewJwts(raw.refreshToken);
        const newState: IPasswordAuthenticatorState = {
          managerType: "PasswordAuthenticator",
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken
        };
        this.state = newState;
        this.scheduleRefresh();

        Api.setAccessTokenRenewer(async () => {
          const token = await this.getAccessJwt();
          if (token == null) throw new Error("Unable to get access token.");
          return token;
        });

        this.authManager.setPersistentState(newState);
        this.authManager.setAccessTokenReady(true);
        return true;
      } else {
        // The previous access token is still valid.
        Api.setAccessTokenRenewer(async () => {
          const token = await this.getAccessJwt();
          if (token == null) throw new Error("Unable to get access token.");
          return token;
        });

        this.scheduleRefresh();
        this.authManager.setAccessTokenReady(true);
        return true;
      }
    }
  }

  private async stop(): Promise<void> {
    if (this.cancelRefreshTimer != null) this.cancelRefreshTimer();
    this.state = null;
  }

  public async externalStateChange(newState: IAuthenticatorState | null): Promise<void> {
    if (newState == null || newState.managerType == null) {
      // Not using password authentication anymore.  Just shut down.
      this.stop();
    } else if (isPasswordAuthenticatorState(newState)) {
      // New tokens were issued.  We need to store them and reschedule the next refresh.
      if (this.cancelRefreshTimer != null) this.cancelRefreshTimer();
      this.state = newState;
      this.scheduleRefresh();
    }
  }

  private scheduleRefresh(): void {
    if (this.state == null) throw new Error("state cannot be null or undefined.");

    const raw: { accessToken: string, refreshToken: string } = { accessToken: this.state.accessToken, refreshToken: this.state.refreshToken };
    const accessToken = reviveJwt(raw.accessToken);
    const now = new Date();

    // Determine how long to wait until the next refresh.
    let duration = accessToken.exp.getTime() - now.getTime() - (10 * 60 * 1000); // Refresh 10 minutes before the access token expires.
    if (duration < 0) duration = 0;

    // Schedule the refresh.
    let timerId = window.setTimeout(this.runScheduledRefresh, duration);

    // Clean up the cancellation timer.
    let newCancelRefreshTimer = () => {
      if (this.cancelRefreshTimer != null) this.cancelRefreshTimer = null;
      window.clearTimeout(timerId);
    };

    this.cancelRefreshTimer = newCancelRefreshTimer;
  }

  private async runScheduledRefresh(): Promise<void> {
    if (this.state == null) throw new Error("state cannot be null or undefined.");

    const newTokens = await Api.identity.generateNewJwts(this.state.refreshToken);
    const newState: IPasswordAuthenticatorState = {
      managerType: "PasswordAuthenticator",
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken
    };
    this.state = newState;
    this.authManager.setPersistentState(newState);
    this.cancelRefreshTimer = null;
    this.scheduleRefresh();
  }

  public async login(email: string, password: string): Promise<AuthenticateResponse> {
    const result = await Api.identity.authenticate(email, password);

    if (result.success) {
      let newState: IPasswordAuthenticatorState = {
        managerType: "PasswordAuthenticator",
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      };
      this.authManager.setPersistentState(newState);
    }

    return result;
  }

  public async logout(): Promise<void> {
    if (this.cancelRefreshTimer != null) this.cancelRefreshTimer();
    this.state = null;
    this.authManager.setPersistentState(null);
  }

  public async register(email: string, password: string, displayName: string, givenName: string, surname: string): Promise<RegisterResponse> {
    const response = await Api.identity.register(email, password, displayName, givenName, surname);

    if (response.success && response.authenticateResponse != null) {
      let newState: IPasswordAuthenticatorState = {
        managerType: "PasswordAuthenticator",
        accessToken: response.authenticateResponse.accessToken,
        refreshToken: response.authenticateResponse.refreshToken
      };
      this.authManager.setPersistentState(newState);
    }

    return response;
  }

  public async getAccessJwt(): Promise<string | null> {
    if (this.state == null) return null;
    return this.state.accessToken;
  }

  public async getRefreshJwt(): Promise<string | null> {
    if (this.state == null) return null;
    return this.state.refreshToken;
  }
}

export interface IPasswordAuthenticatorState extends IAuthenticatorState {
  managerType: "PasswordAuthenticator";
  refreshToken: string;
  accessToken: string;
}

export interface PasswordAccessJwt {
  /** Audience */
  aud: string;
  /** Expiration */
  exp: Date;
  iat: Date;
  /** Issuer */
  iss: string;
  /** Not before */
  nbf: Date;
  /** Subject */
  sub: string;
}

function reviveJwt(rawToken: string): PasswordAccessJwt {
  let parsed = parseJwt(rawToken);

  let revived: PasswordAccessJwt = {
    aud: parsed["aud"],
    exp: new Date(parsed["exp"] * 1000),  // Need to multiply by 1000 to convert from Unix epoch to JS Date.
    iat: new Date(parsed["iat"] * 1000),
    iss: parsed["iss"],
    nbf: new Date(parsed["nbf"] * 1000),
    sub: parsed["sub"]
  };

  return revived;
}

function parseJwt(rawToken: string): any {
  // https://stackoverflow.com/a/38552302/18490152
  let base64Url = rawToken.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

function isPasswordAuthenticatorState(state: IAuthenticatorState | null): state is IPasswordAuthenticatorState {
  if (state != null && state.managerType === "PasswordAuthenticator") return true;
  return false;
}
