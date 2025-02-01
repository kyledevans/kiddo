import { createContext, useState, Dispatch, SetStateAction, FunctionComponent, useEffect, useContext, ComponentType, useCallback } from "react";
import { Text, mergeStyleSets, PrimaryButton } from "@fluentui/react";

import { Api } from "../api/api";
import { Profile } from "../api/profile";
import { ProblemDetailsError } from "../api/http-client";
import { ProblemDetailTypes } from "../api/constants";
import { AuthenticationManagerStateType, IAuthenticationManager } from "./authentication";
import { useAuthenticationManager, useAuthenticationManagerState, useIsAccessTokenReady } from "./authentication-react";
import { useSpaConfiguration } from "./spa-configuration";
import { useSnackbar } from "./snackbar";

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

const CurrentProfileToken = createContext<CurrentProfileContextType>([
  null,
  () => { throw new Error("AppCurrentProfileContextProvider must be a parent in the React DOM."); }
]);

function useInitializationEffect(isAccessTokenReady: boolean, authManager: IAuthenticationManager | null, authState: AuthenticationManagerStateType | null, setCurrentProfile: Dispatch<SetStateAction<Profile | null | "Anonymous" | "Unregistered">>) {
  useEffect(() => {
    (async () => {
      if (authState === AuthenticationManagerStateType.Running) {
        if (authManager == null) throw new Error("Authentication manager state cannot be \"Running\" if the authentication manager instance is itself null or undefined.");

        if (authManager.authenticator == null) {
          setCurrentProfile("Anonymous");
        } else {
          try {
            const profile = await Api.profile.getProfile();
            setCurrentProfile(profile);
          } catch (ex) {
            if (ex instanceof ProblemDetailsError && ex.type === ProblemDetailTypes.UserNotRegistered) {
              setCurrentProfile("Unregistered");
            } else {
              throw ex;
            }
          }
        }
      }
    })();
  }, [isAccessTokenReady, authManager, authState, setCurrentProfile]);
}

export const AppCurrentProfileContextProvider: FunctionComponent = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null | "Anonymous" | "Unregistered">(null);
  const authManager = useAuthenticationManager();
  const authState = useAuthenticationManagerState();
  const isAccessTokenReady = useIsAccessTokenReady();

  const newContext: CurrentProfileContextType = [profile, setProfile];

  useInitializationEffect(isAccessTokenReady, authManager, authState, setProfile);

  return (
    <>
      <CurrentProfileToken.Provider value={newContext}>{children}</CurrentProfileToken.Provider>
    </>
  );
}

export function useCurrentProfile(): CurrentProfileContextType {
  return useContext(CurrentProfileToken);
}

export function useCurrentProfileRequired(): Profile {
  const [profile] = useContext(CurrentProfileToken);

  if (profile == null) throw new Error("profile cannot be null or undefined.");
  else if (profile === "Anonymous") throw new Error("profile cannot be \"Anonymous\".");
  else if (profile === "Unregistered") throw new Error("profile cannot be \"Unregistered\".")

  return profile;
}

export function withRequiredProfile<T>(RestrictedComponent: ComponentType<T>) {
  const NewComponent = (props: T) => {
    const [me] = useCurrentProfile();

    if (me == null) {
      // Still waiting for things to load.
      return (<></>);
    } else if (me === "Anonymous" || me === "Unregistered") {
      return (
        <div className={pageStyles.page}>
          <Text className={pageStyles.header} block variant="xxLargePlus">Registration required</Text>
        </div>
      );
    }
    else {
      return (<RestrictedComponent {...props} />);
    }
  };

  return NewComponent;
}

export function withRequiredEmailConfirmation<T>(RestrictedComponent: ComponentType<T>) {
  const NewComponent = (props: T) => {
    const [me] = useCurrentProfile();
    const spaConfig = useSpaConfiguration();
    const snackbar = useSnackbar();

    const onSendConfirmationClick = useCallback(() => {
      if (me == null || me === "Anonymous" || me === "Unregistered" || me.email == null) return;

      Api.profile.sendConfirmationEmail(me.email);
      snackbar.open("Confirmation email sent.");
    }, [snackbar, me]);

    if (spaConfig == null || me == null || typeof me !== "object") return (<></>);

    if (spaConfig != null && spaConfig.isEmailConfirmationRequired && me != null && typeof me === "object" && !me.isEmailConfirmed) {
      return (
        <div className={pageStyles.page}>
          <Text className={pageStyles.header} block variant="xxLargePlus">Email confirmation required</Text>
          {me.email == null ? undefined : (<PrimaryButton onClick={onSendConfirmationClick}>Send confirmation email</PrimaryButton>)}
        </div>
      );
    }

    return (<RestrictedComponent {...props} />);
  };

  return NewComponent;
}

export type CurrentProfileContextType = [currentProfile: Profile | null | "Anonymous" | "Unregistered", setCurrentProfile: Dispatch<SetStateAction<Profile | null | "Anonymous" | "Unregistered">>];
