import { FunctionComponent, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FontWeights, CommandBarButton, mergeStyleSets, IIconProps, Text} from "@fluentui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useParams } from "react-router-dom";

import { PolicyType, withRequiredPolicy } from "../../common/current-authorization";
import { useTitleEffect } from "../../common/title";
import { User } from "../../api/user";
import { AccountLink, RegisterStatusCodeType } from "../../api/azure-ad";
import { Api } from "../../api/api";
import { AppTheme } from "../../common/themes";
import { AzureAdAuthenticator } from "../../common/azure-ad-authenticator";
import { AuthenticationMethodType } from "../../common/authentication";
import { useSpaConfiguration } from "../../common/spa-configuration";
import { useAuthenticationManager } from "../../common/authentication-react";
import { DialogControlType, PasswordRemoveDialog, PasswordResetDialog, PasswordSetDialog } from "./dialogs";
import { Toolbar, ToolbarColumn3 } from "../../common/toolbar";
import { withRequiredEmailConfirmation, withRequiredProfile } from "../../common/current-profile";
import { GuidEmpty } from "../../api/constants";

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

function useInitializationEffect(userId: string, setUser: (newUser: User) => void, setAzureAdAccountLinks: (newLinks: AccountLink[]) => void) {
  useEffect(() => {
    (async () => {
      const user = await Api.user.getUser(userId);
      const azureAdAccountLinks = await Api.azureAd.getAccountLinksByUserId(userId);

      setUser(user);
      setAzureAdAccountLinks(azureAdAccountLinks);
    })();
  }, [setUser, setAzureAdAccountLinks, userId]);
}

const PasswordIdentityCard: FunctionComponent<{ user: User, setUserUpdated: (newUser: User) => void }> = ({ user, setUserUpdated }) => {
  const passwordSetDlg = useRef<DialogControlType | null>(null);
  const passwordResetDlg = useRef<DialogControlType | null>(null);
  const passwordRemoveDlg = useRef<DialogControlType | null>(null);

  const onSetPasswordClick = useCallback(() => {
    passwordSetDlg.current?.open();
  }, [passwordSetDlg]);

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
          <CommandBarButton onClick={onSetPasswordClick}>Set password</CommandBarButton>
          <CommandBarButton onClick={onResetPasswordClick}>Reset password</CommandBarButton>
          <CommandBarButton title={user.hasPassword ? "" : "User does not have a password set."} className={pageStyles.detailsToolbarLast} iconProps={icons.delete} onClick={onRemoveClick} disabled={!user.hasPassword}>Remove</CommandBarButton>
        </div>
      </div>
      <PasswordSetDialog user={user} dialogControl={passwordSetDlg} setUserUpdated={setUserUpdated} />
      <PasswordResetDialog user={user} dialogControl={passwordResetDlg} />
      <PasswordRemoveDialog user={user} dialogControl={passwordRemoveDlg} setUserUpdated={setUserUpdated} />
    </div>
  );
}

const AzureAdIdentityCard: FunctionComponent<{ external: AccountLink, onRemoved: () => void }> = ({ external, onRemoved }) => {
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

const UsersEditLoginsPageInner: FunctionComponent = () => {
  const { userId: userIdStr } = useParams<{ userId?: string | undefined }>();
  const userId = userIdStr == null ? GuidEmpty : userIdStr;
  const [user, setUser] = useState<User | null>();
  const [azureAdAccountLinks, setAzureAdAccountLinks] = useState<AccountLink[]>([]);

  const onAzureAdAcccountLinkRemoved = useCallback(() => { }, []);

  useTitleEffect("Edit Logins");

  useInitializationEffect(userId, setUser, setAzureAdAccountLinks);

  if (user == null) return (<></>);

  return (
    <div className={pageStyles.page}>
      <PasswordIdentityCard user={user} setUserUpdated={setUser} />
      {azureAdAccountLinks.map((external) => (<AzureAdIdentityCard key={external.providerKey} external={external} onRemoved={onAzureAdAcccountLinkRemoved} />))}
    </div>
  );
}

let UsersEditLoginsPage = withRequiredProfile(UsersEditLoginsPageInner);
UsersEditLoginsPage = withRequiredPolicy(UsersEditLoginsPage, PolicyType.SuperAdministrator);
UsersEditLoginsPage = withRequiredEmailConfirmation(UsersEditLoginsPage);

export default UsersEditLoginsPage;
