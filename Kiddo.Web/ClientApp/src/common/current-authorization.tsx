import { createContext, useState, Dispatch, SetStateAction, FunctionComponent, useEffect, useContext, ComponentType } from "react";
import { useHistory } from "react-router-dom";
import { Text, mergeStyleSets } from "@fluentui/react";

import { Api } from "../api/api";
import { PolicySummary } from "../api/profile";
import { AuthenticationManagerStateType } from "./authentication";
import { useAuthenticationManagerState, useCurrentAuthenticationMethod, useIsAccessTokenReady } from "./authentication-react";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content 1fr",
    overflow: "hidden",
    justifyItems: "center"
  },
  header: {
    margin: "50px 0 50px 0"
  }
});

export enum PolicyType {
  AzureAd = "AzureAd",
  AspNetIdentity = "AspNetIdentity",
  SuperAdministrator = "SuperAdministrator",
  Administrator = "Administrator",
  User = "User",
  ReadOnlyUser = "ReadOnlyUser"
}

const defaultPolicies: PolicySummary = {
  isAzureAd: false,
  isAspNetIdentity: false,
  isSuperAdministrator: false,
  isAdministrator: false,
  isUser: false,
  isReadOnlyUser: false
};

const CurrentAuthorizationContextToken = createContext<CurrentPoliciesContextType>([null, () => { throw new Error("AppCurrentAuthorizationContextProvider has not been initialized.") }]);

export const AppCurrentAuthorizationContextProvider: FunctionComponent = ({ children }) => {
  const [policies, setPolicies] = useState<PolicySummary | null>(null);
  const isAccessTokenReady = useIsAccessTokenReady();

  const newContext: CurrentPoliciesContextType = [policies, setPolicies];

  useEffect(() => {
    (async () => {
      if (isAccessTokenReady) {
        const newPolicies = await Api.profile.getAuthorizationPolicies();
        setPolicies(newPolicies);
      } else {
        setPolicies(defaultPolicies);
      }
    })();
  }, [isAccessTokenReady, setPolicies]);

  return (
    <>
      <CurrentAuthorizationContextToken.Provider value={newContext}>{children}</CurrentAuthorizationContextToken.Provider>
    </>
  );
}

export function useCurrentPolicies(): CurrentPoliciesContextType {
  const context = useContext(CurrentAuthorizationContextToken);
  return context;
}

export function withRequiredPolicy<T>(RestrictedComponent: ComponentType<T>, policy: PolicyType) {
  const NewComponent = (props: T) => {
    const [policies] = useCurrentPolicies();
    const history = useHistory();
    const authMethod = useCurrentAuthenticationMethod();
    const authManagerState = useAuthenticationManagerState();

    useEffect(() => {
      if (authManagerState === AuthenticationManagerStateType.Running && authMethod === "Anonymous") {
        history.push("/");
      }
    }, [authMethod, history, authManagerState]);

    // Don't render anything if we are still waiting for the policy information to load.
    if (policies == null) return (<></>);

    let isSatisfied: boolean;

    if (policy === PolicyType.AzureAd && policies.isAzureAd) isSatisfied = true;
    else if (policy === PolicyType.AspNetIdentity && policies.isAspNetIdentity) isSatisfied = true;
    else if (policy === PolicyType.SuperAdministrator && policies.isSuperAdministrator) isSatisfied = true;
    else if (policy === PolicyType.Administrator && policies.isAdministrator) isSatisfied = true;
    else if (policy === PolicyType.User && policies.isUser) isSatisfied = true;
    else if (policy === PolicyType.ReadOnlyUser && policies.isReadOnlyUser) isSatisfied = true;
    else isSatisfied = false;

    if (isSatisfied) {
      return (<RestrictedComponent {...props} />);
    } else {
      return (
        <div className={pageStyles.page}>
          <Text className={pageStyles.header} block variant="xxLargePlus">Restricted</Text>
        </div>
      );
    }
  };

  return NewComponent;
}

export type CurrentPoliciesContextType = [currentPolicies: PolicySummary | null, setCurrentPolicies: Dispatch<SetStateAction<PolicySummary | null>>];
