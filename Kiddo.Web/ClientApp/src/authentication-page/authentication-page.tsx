import { FunctionComponent, ReactFragment } from "react";
import { mergeStyleSets, Text } from "@fluentui/react";

import { useTitleEffect } from "../common/title";
import { RouterCompoundButton } from "../common/router-link";
import { useSpaConfiguration } from "../common/spa-configuration";
import { SpaConfiguration } from "../api/app";
import { AuthenticationMethodType } from "../common/authentication";
import { AppName } from "../common/constants";
import { useCurrentProfile } from "../common/current-profile";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content min-content min-content",
    overflow: "hidden"
  },
  header: {
    textAlign: "center",
    marginTop: 50
  },
  authWrapper: {
    display: "flex",
    justifyContent: "center",
    gap: 100,
    marginTop: 100
  },
  authButton: {
    flex: "0 0 200px"
  }
});

const AuthenticationPageInner: FunctionComponent<{ spaConfig: SpaConfiguration }> = ({ spaConfig }) => {
  const isAzureAdEnabled = spaConfig.authMethods.indexOf(AuthenticationMethodType.AzureAd) >= 0;
  const isPasswordEnabled = spaConfig.authMethods.indexOf(AuthenticationMethodType.Password) >= 0;
  const [me] = useCurrentProfile();

  let loginContent: ReactFragment;

  if (me == null) {
    loginContent = (<></>);
  } else if (me === "Anonymous" || me === "Unregistered") {
    loginContent = (<>
      <div className={pageStyles.authWrapper}>
        {!isAzureAdEnabled ? null : (
          <RouterCompoundButton className={pageStyles.authButton} primary secondaryText="Login with single sign on" to="/azure-ad/login">Microsoft</RouterCompoundButton>
        )}
        {!isPasswordEnabled ? null : (
          <RouterCompoundButton className={pageStyles.authButton} primary secondaryText="Login with a password" to="/password-login">Password</RouterCompoundButton>
        )}
      </div>
    </>);
  } else {
    loginContent = (<></>);
  }

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="mega">Welcome to {AppName}!</Text>
      {loginContent}
    </div>
  );
}

function AuthenticationPage() {
  const spaConfig = useSpaConfiguration();
  useTitleEffect("Authentication");

  return (
    <>
      {spaConfig == null ? null : (<AuthenticationPageInner spaConfig={spaConfig} />)}
    </>
  );
}

export default AuthenticationPage;
