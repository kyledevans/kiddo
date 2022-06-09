import { FunctionComponent, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FontWeights, CommandBarButton, mergeStyleSets, IIconProps, Text, IContextualMenuProps, DirectionalHint } from "@fluentui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { PolicyType, withRequiredPolicy } from "../common/current-authorization";
import { useTitleEffect } from "../common/title";
import { Profile } from "../api/profile";
import { AccountLink, RegisterStatusCodeType } from "../api/azure-ad";
import { Api } from "../api/api";
import { AppTheme } from "../common/themes";
import { AzureAdAuthenticator } from "../common/azure-ad-authenticator";
import { AuthenticationMethodType } from "../common/authentication";
import { useSpaConfiguration } from "../common/spa-configuration";
import { useAuthenticationManager } from "../common/authentication-react";
import { DialogControlType, PasswordChangeDialog, PasswordRemoveDialog, PasswordResetDialog, PasswordSetDialog } from "./dialogs";
import { Toolbar, ToolbarColumn3 } from "../common/toolbar";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content 1fr",
    overflow: "hidden"
  },
  card: {
    display: "grid",
    gridTemplateColumns: "144px 1fr",
    height: 108,
    border: `1px solid ${AppTheme.palette.neutralLight}`,
    userSelect: "none",
    maxWidth: 800,
    margin: 16
  },
  preview: {
    backgroundColor: AppTheme.palette.neutralLighterAlt,
    borderRight: `1px solid ${AppTheme.palette.neutralLight}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "16px 0"
  },
  previewIconWrapper: {
    textAlign: "center",
  },
  previewIcon: {
    fontSize: AppTheme.fonts.xxLarge.fontSize,
    margin: "0 4px"
  },
  previewTitle: {
    textAlign: "center"
  },
  details: {
    display: "grid",
    gridTemplateRows: "min-content 1fr min-content"
  },
  detailsToolbar: {
    height: 34,
    display: "grid",
    gridTemplateColumns: "repeat(10, min-content) 1fr min-content",
    gridTemplateRows: "1fr",
    gridAutoColumns: "min-content",
    selectors: {
      ".ms-Button": {
        whiteSpace: "nowrap"
      }
    }
  },
  detailsToolbarLast: {
    gridColumnStart: "-1"
  },
  detailsInformation: {
    height: 32,
    paddingLeft: 8,
    display: "grid",
    gridTemplateColumns: "repeat(10, min-content)",
    columnGap: 16
  },
  detailsBox: {
    flex: "0 0 auto",
    display: "grid",
    gridTemplateRows: "16px 16px"
  },
  boxTitle: {
    fontWeight: FontWeights.semibold,
    gridRowStart: 1,
    whiteSpace: "nowrap"
  },
  boxText: {
    fontWeight: FontWeights.regular,
    color: "rgb(96, 94, 92)",
    whiteSpace: "nowrap"
  }
});

const icons: { password: IconProp, azureAd: IconProp, delete: IIconProps, add: IIconProps } = {
  password: { prefix: "fas", iconName: "key" },
  azureAd: { prefix: "fab", iconName: "microsoft" },
  delete: { iconName: "Delete" },
  add: { iconName: "Add" }
};

function useInitializationEffect(setProfile: (newProfile: Profile) => void, setAzureAdAccountLinks: (newLinks: AccountLink[]) => void) {
  useEffect(() => {
    (async () => {
      const profile = await Api.profile.getProfile();
      const azureAdAccountLinks = await Api.azureAd.getAccountLinks();

      if (profile == null) throw new Error("profile cannot be null or undefined.");

      setProfile(profile);
      setAzureAdAccountLinks(azureAdAccountLinks);
    })();
  }, [setProfile, setAzureAdAccountLinks]);
}

const PasswordIdentityCard: FunctionComponent<{ profile: Profile, setProfileUpdated: (newProfile: Profile) => void }> = ({ profile, setProfileUpdated }) => {
  const passwordChangeDlg = useRef<DialogControlType | null>(null);
  const passwordResetDlg = useRef<DialogControlType | null>(null);
  const passwordRemoveDlg = useRef<DialogControlType | null>(null);

  const onChangePasswordClick = useCallback(() => {
    passwordChangeDlg.current?.open();
  }, [passwordChangeDlg]);

  const onResetPasswordClick = useCallback(() => {
    passwordResetDlg.current?.open();
  }, [passwordResetDlg]);

  const onRemoveClick = useCallback(() => {
    passwordRemoveDlg.current?.open();
  }, []);

  return (
    <div className={pageStyles.card}>
      <div className={pageStyles.preview}>
        <div className={pageStyles.previewIconWrapper}>
          <FontAwesomeIcon icon={icons.password} size="3x" />
        </div>
        <Text variant="large" block className={pageStyles.previewTitle}>Password</Text>
      </div>
      <div className={pageStyles.details}>
        <div className={pageStyles.detailsToolbar}>
          <CommandBarButton onClick={onChangePasswordClick}>Change password</CommandBarButton>
          <CommandBarButton onClick={onResetPasswordClick}>Reset password</CommandBarButton>
          <CommandBarButton className={pageStyles.detailsToolbarLast} iconProps={icons.delete} onClick={onRemoveClick}>Remove</CommandBarButton>
        </div>
      </div>
      <PasswordChangeDialog dialogControl={passwordChangeDlg} />
      <PasswordResetDialog dialogControl={passwordResetDlg} />
      <PasswordRemoveDialog dialogControl={passwordRemoveDlg} setProfileUpdated={setProfileUpdated} />
    </div>
  );
}

const AzureAdIdentityCard: FunctionComponent<{ profile: Profile, external: AccountLink, onRemoved: () => void }> = ({ profile, external, onRemoved }) => {
  const onRemoveLinkClick = useCallback(async () => {
    if (external == null) throw new Error("external cannot be null or undefined.");
    await Api.azureAd.removeLink(external.providerKey);
    onRemoved();
  }, [external, onRemoved]);

  return (
    <div className={pageStyles.card}>
      <div className={pageStyles.preview}>
        <div className={pageStyles.previewIconWrapper}>
          <FontAwesomeIcon icon={icons.azureAd} size="3x" />
        </div>
        <Text variant="large" block className={pageStyles.previewTitle}>Azure AD</Text>
      </div>
      <div className={pageStyles.details}>
        <div className={pageStyles.detailsToolbar}>
          <CommandBarButton className={pageStyles.detailsToolbarLast} iconProps={icons.delete} text="Remove" onClick={onRemoveLinkClick} />
        </div>
        <div></div>
        <div className={pageStyles.detailsInformation}>
          <div className={pageStyles.detailsBox}>
            <Text className={pageStyles.boxTitle} block variant="small">Name</Text>
            <Text className={pageStyles.boxText} block variant="small">{external.displayName}</Text>
          </div>
          <div className={pageStyles.detailsBox}>
            <Text className={pageStyles.boxTitle} block variant="small">Email</Text>
            <Text className={pageStyles.boxText} block variant="small">{external.email}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

const LoginsPageInner: FunctionComponent<{ profile: Profile, setProfile: (newProfile: Profile) => void, azureAdAccountLinks: AccountLink[], setAzureAdAccountLinks: (newLinks: AccountLink[]) => void }> = ({ profile, setProfile, azureAdAccountLinks, setAzureAdAccountLinks }) => {
  const spaConfig = useSpaConfiguration();
  const authManager = useAuthenticationManager();
  const setPasswordDlg = useRef<DialogControlType | null>(null);

  const onAddPasswordClick = useCallback(() => {
    setPasswordDlg.current?.open();
  }, [setPasswordDlg]);

  const onAddAzureClick = useCallback(() => {
    (async () => {
      if (authManager == null) throw new Error("authManager cannot be null or undefined.");
      const azure = authManager.getAuthenticator<AzureAdAuthenticator>(AuthenticationMethodType.AzureAd);
      if (azure == null) throw new Error("Could not find AzureAdAuthenticator instance.");

      let loginResponse = await azure.login(false);
      if (loginResponse == null) throw new Error("response cannot be null or undefined.");

      if (loginResponse.account != null) {
        const accessToken = await azure.getAccessTokenPassive(true, loginResponse.account);
        const linkResponse = await Api.azureAd.linkToExisting(accessToken);
        if (linkResponse.statusCode === RegisterStatusCodeType.Success) {
          let newLinks = await Api.azureAd.getAccountLinks();
          setAzureAdAccountLinks(newLinks);
        }
      }
    })();
  }, [authManager, setAzureAdAccountLinks]);

  const onAzureAdAcccountLinkRemoved = useCallback(async () => {
    const newLinks = await Api.azureAd.getAccountLinks();
    setAzureAdAccountLinks(newLinks);
  }, [setAzureAdAccountLinks]);

  const addIdentityMenuProps: IContextualMenuProps = useMemo(() => {
    const menuProps: IContextualMenuProps = { items: [], directionalHint: DirectionalHint.bottomRightEdge };

    if (spaConfig == null) return menuProps;

    // We can only have 1 password, so hide the option to add one if we already have it.
    if (!profile.hasPassword && spaConfig.authMethods.indexOf(AuthenticationMethodType.Password) >= 0) {
      menuProps.items.push({ key: "password", text: "Password", onClick: onAddPasswordClick, onRenderContent: (props, { renderItemName: ItemName }) => { return (<><FontAwesomeIcon icon={icons.password} size="lg" fixedWidth color={AppTheme.palette.themePrimary} />{ItemName(props)}</>); } });
    }

    // Multiple Azure AD accounts can be mapped to 1 application user, so continue to show this option as long as the auth method is enabled.
    if (spaConfig.authMethods.indexOf(AuthenticationMethodType.AzureAd) >= 0) {
      menuProps.items.push({ key: "azureAd", text: "Azure AD", onClick: onAddAzureClick, onRenderContent: (props, { renderItemName: ItemName }) => { return (<><FontAwesomeIcon icon={icons.azureAd} size="lg" fixedWidth color={AppTheme.palette.themePrimary} />{ItemName(props)}</>); } });
    }

    return menuProps;
  }, [onAddPasswordClick, onAddAzureClick, profile, spaConfig]);

  const setProfileUpdated = useCallback((newProfile: Profile) => {
    setProfile(newProfile);
  }, [setProfile]);

  return (
    <div className={pageStyles.page}>
      <Toolbar>
        <ToolbarColumn3><CommandBarButton iconProps={icons.add} text="New login" menuProps={addIdentityMenuProps} primary /></ToolbarColumn3>
      </Toolbar>
      <div>
        {profile.hasPassword ? (<PasswordIdentityCard profile={profile} setProfileUpdated={setProfileUpdated} />) : null}
        {azureAdAccountLinks.map((external) => (<AzureAdIdentityCard key={external.providerKey} profile={profile} external={external} onRemoved={onAzureAdAcccountLinkRemoved} />))}
      </div>
      <PasswordSetDialog dialogControl={setPasswordDlg} setProfileUpdated={setProfileUpdated} />
    </div>
  );
}

const LoginsPageDeps: FunctionComponent = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [azureAdAccountLinks, setAzureAdAccountLinks] = useState<AccountLink[]>([]);

  useTitleEffect("Logins");
  useInitializationEffect(setProfile, setAzureAdAccountLinks);

  return (<>
      {(profile != null) && (<LoginsPageInner profile={profile} setProfile={setProfile} azureAdAccountLinks={azureAdAccountLinks} setAzureAdAccountLinks={setAzureAdAccountLinks} />)}
  </>);
}

let ProfilePage = withRequiredPolicy(LoginsPageDeps, PolicyType.ReadOnlyUser);

export default ProfilePage;
