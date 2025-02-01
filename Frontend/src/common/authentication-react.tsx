import { createContext, useState, FunctionComponent, useEffect, useContext, ComponentType } from "react";
import { MsalProvider } from "@azure/msal-react";
import { IPublicClientApplication } from "@azure/msal-browser";

import { IAuthenticationManager, AuthenticationManagerStateType } from "./authentication";
import { AuthenticationManager } from "./authentication-manager";
import { useBrowserSettings } from "./browser-settings";
import { useSpaConfiguration } from "./spa-configuration";
import { PasswordAuthenticator } from "./password-authenticator";
import { AzureAdAuthenticator } from "./azure-ad-authenticator";

const CurrentAuthenticationManagerToken = createContext<IAuthenticationManager | null>(null);
const CurrentAuthenticationManagerStateToken = createContext<AuthenticationManagerStateType | null>(null);
const CurrentAuthenticationMethodToken = createContext<CurrentAuthenticationMethodType | null>(null);
const AccessTokenReadyToken = createContext<boolean>(false);

export const AppAuthenticationManagerContextProvider: FunctionComponent = ({ children }) => {
  const [authManager, setAuthManager] = useState<IAuthenticationManager | null>(null);
  const [authManagerState, setAuthManagerState] = useState<AuthenticationManagerStateType | null>(null);
  const [authMethod, setAuthMethod] = useState<CurrentAuthenticationMethodType | null>(null);
  const [isAccessTokenReady, setAccessTokenReady] = useState<boolean>(false);
  const [pca, setPca] = useState<IPublicClientApplication | null>(null);
  const spaConfig = useSpaConfiguration();
  const [browserSettings] = useBrowserSettings();

  useEffect(() => {
    if (spaConfig != null) {
      const newAuthManager = new AuthenticationManager(spaConfig.authMethods, spaConfig);
      newAuthManager.configureFramework({
        setState: setAuthManagerState,
        setPca: setPca,
        setAccessTokenReady: setAccessTokenReady
      });
      newAuthManager.startAuthentication();
      setAuthManager(newAuthManager);
    }
  }, [spaConfig, browserSettings, setAuthManager]);

  useEffect(() => {
    if (authManager == null || authManagerState == null) setAuthMethod(null);
    else if (authManager.authenticator == null && authManagerState === AuthenticationManagerStateType.Initializing) setAuthMethod(null);
    else if (authManager.authenticator == null && authManagerState === AuthenticationManagerStateType.Running) setAuthMethod("Anonymous");
    else if (authManager.authenticator instanceof PasswordAuthenticator) setAuthMethod("Password");
    else if (authManager.authenticator instanceof AzureAdAuthenticator) setAuthMethod("AzureAd");
    else throw new Error("Unable to determine current authentication method.");
  }, [authManager, authManagerState, setAuthMethod]);

  return (<>
    <CurrentAuthenticationManagerToken.Provider value={authManager}>
      <CurrentAuthenticationManagerStateToken.Provider value={authManagerState}>
        <AccessTokenReadyToken.Provider value={isAccessTokenReady}>
          <CurrentAuthenticationMethodToken.Provider value={authMethod}>
            {pca == null ? (<>{children}</>) : (<><MsalProvider instance={pca}>{children}</MsalProvider></>)}{/* The MsalProvider needs to encapsulate all logic that deals with authentication. */}
          </CurrentAuthenticationMethodToken.Provider>
        </AccessTokenReadyToken.Provider>
      </CurrentAuthenticationManagerStateToken.Provider>
    </CurrentAuthenticationManagerToken.Provider>
  </>);
}

export function useAuthenticationManager(): IAuthenticationManager | null {
  const context = useContext(CurrentAuthenticationManagerToken);
  return context;
}

export function useAuthenticationManagerState(): AuthenticationManagerStateType | null {
  const context = useContext(CurrentAuthenticationManagerStateToken);
  return context;
}

export function useCurrentAuthenticationMethod(): CurrentAuthenticationMethodType | null {
  const authMethod = useContext(CurrentAuthenticationMethodToken);
  return authMethod;
}

export function useIsAccessTokenReady(): boolean {
  const isAccessTokenReady = useContext(AccessTokenReadyToken);
  return isAccessTokenReady;
}

export function withRequiredAccessToken<T>(RestrictedComponent: ComponentType<T>) {
  const NewComponent = (props: T) => {
    const isAccessTokenReady = useIsAccessTokenReady();

    if (isAccessTokenReady) return (<></>);
    else return (<RestrictedComponent {...props} />);
  };

  return NewComponent;
}

export type CurrentAuthenticationMethodType = "Password" | "AzureAd" | "Anonymous";
