import { createContext, useState, Dispatch, SetStateAction, FunctionComponent, useEffect, useContext, ComponentType, useMemo } from "react";
import { Text, mergeStyleSets } from "@fluentui/react";

import { Api } from "../api/api";
import { PolicySummary } from "../api/profile";
import { useIsAccessTokenReady } from "./authentication-react";

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

export function withRequiredPolicy<T>(RestrictedComponent: ComponentType<T>, policy: PolicyType, showErrorMessage?: boolean) {
  const NewComponent = (props: T) => {
    const [policies] = useCurrentPolicies();

    const isSatisfied: boolean | null = useMemo(() => {
      if (policies == null) return null;
      else if (policy === PolicyType.AzureAd && policies.isAzureAd) return true;
      else if (policy === PolicyType.AspNetIdentity && policies.isAspNetIdentity) return true;
      else if (policy === PolicyType.SuperAdministrator && policies.isSuperAdministrator) return true;
      else if (policy === PolicyType.Administrator && policies.isAdministrator) return true;
      else if (policy === PolicyType.User && policies.isUser) return true;
      else if (policy === PolicyType.ReadOnlyUser && policies.isReadOnlyUser) return true;
      else return false;
    }, [policies]);

    if (isSatisfied == null) {
      // Don't render anything if we are still waiting for the policy information to load.
      return (<></>);
    } else if (isSatisfied) {
      return (<RestrictedComponent {...props} />);
    } else if (showErrorMessage === false) {
      return (<></>);
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
