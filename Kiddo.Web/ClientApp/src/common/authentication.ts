import { IPublicClientApplication } from "@azure/msal-browser";

export interface IAuthenticationManager {
  authenticator: IAuthenticator | null;
  configureFramework: (integration: IFrameworkIntegration | null) => void;
  getState: () => AuthenticationManagerStateType;
  setState: (value: AuthenticationManagerStateType) => void;
  startAuthentication: () => Promise<void>;
  logout: () => Promise<void>;
  setPersistentState: (newState: IAuthenticatorState | null) => void;
  setAccessTokenReady: (isReady: boolean) => void;
  getAuthenticator: <T extends IAuthenticator>(authMethod: AuthenticationMethodType | null) => T | null;
}

export interface IFrameworkIntegration {
  setState: (newState: AuthenticationManagerStateType) => void;
  setPca: (newPca: IPublicClientApplication) => void;
  setAccessTokenReady: (isReady: boolean) => void;
}

export interface IAuthenticator {
  start: () => Promise<boolean>;
  getAccessJwt: () => Promise<string | null>;
  logout: () => Promise<void>;
  externalStateChange: (newState: IAuthenticatorState | null) => Promise<void>;
}

export interface IAuthenticatorState {
  managerType: "AzureAd" | "PasswordAuthenticator" | null;
}

export enum AuthenticationManagerStateType {
  Initializing = 0,
  Running = 1
}

export enum AuthenticationMethodType {
  AzureAd = 1,
  Password = 2
}
