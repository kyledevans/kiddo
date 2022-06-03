import { FunctionComponent, useCallback, useState, useEffect, useRef, useMemo, MouseEvent } from "react";
import { FontWeights, Stack, CommandBarButton, mergeStyleSets, IIconProps, PrimaryButton, Text, TextField, Pivot, PivotItem, IContextualMenuProps, DirectionalHint } from "@fluentui/react";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { Api } from "../api/api";
import { Profile } from "../api/profile";
import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { isNonEmptyString } from "../common/helper-functions";
import { useFormStateRefs } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { useSnackbar } from "../common/snackbar";
import { ErrorCallout, ErrorCalloutControl } from "../common/error-callout";
import { PolicyType, withRequiredPolicy } from "../common/current-authorization";
import { AppTheme } from "../common/themes";
import { useAuthenticationManager } from "../common/authentication-react";
import { AzureAdAuthenticator } from "../common/azure-ad-authenticator";
import { AuthenticationMethodType } from "../common/authentication";
import { AccountLink, RegisterStatusCodeType } from "../api/azure-ad";
import { useHistory } from "react-router-dom";
import { useSpaConfiguration } from "../common/spa-configuration";
import { PasswordResetDialog, PasswordChangeDialog, PasswordRemoveDialog, DialogControlType, PasswordSetDialog } from "./dialogs";

interface PageFormType {
  givenName: string;
  surname: string;
  displayName: string;
  email: string;
}

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content min-content 1fr",
    overflow: "hidden"
  },
  pageNotificationBar: {

  },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "300px",
    padding: "8px 16px 8px 16px",
    selectors: {
      ".toolbar-right": {
        textAlign: "right",
        whiteSpace: "nowrap"
      }
    }
  },
  toolbar2: {
    height: 44,
    margin: "0 16px"
  },
  btnDelete: {
    marginRight: 32
  },
  editForm: {
    marginTop: 8
  },
  profileTab: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridAutoRows: "min-content",
    overflowY: "auto",
    padding: 16,
    gridRowGap: 16
  },
  profileToolbar: {
    maxWidth: 300,
  },
  identityToolbar: {
    maxWidth: 800
  },
  row: {
    display: "grid",
    gridTemplateColumns: "300px min-content",
    gridRowEnd: "span 1",
    gridColumnEnd: "span 2"
  },
  col1: {
    gridColumnStart: "1",
    gridColumnEnd: "span 1"
  },
  col2: {
    gridColumnStart: "2",
    gridColumnEnd: "span 1",
    marginTop: 24,
    whiteSpace: "nowrap",
    marginLeft: 32
  }
});

const icons: { saveIcon: IIconProps, deleteIcon: IIconProps, addIcon: IIconProps } = {
  saveIcon: { iconName: "Save" },
  deleteIcon: { iconName: "Delete" },
  addIcon: { iconName: "Add" }
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

const identityStyles = mergeStyleSets({
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

const identityIcons: { password: IconProp, azureAd: IconProp } = {
  password: { prefix: "fas", iconName: "key" },
  azureAd: { prefix: "fab", iconName: "microsoft" },
};

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
    <div className={identityStyles.card}>
      <div className={identityStyles.preview}>
        <div className={identityStyles.previewIconWrapper}>
          <FontAwesomeIcon icon={identityIcons.password} size="3x" />
        </div>
        <Text variant="large" block className={identityStyles.previewTitle}>Password</Text>
      </div>
      <div className={identityStyles.details}>
        <div className={identityStyles.detailsToolbar}>
          <CommandBarButton onClick={onChangePasswordClick}>Change password</CommandBarButton>
          <CommandBarButton onClick={onResetPasswordClick}>Reset password</CommandBarButton>
          <CommandBarButton className={identityStyles.detailsToolbarLast} iconProps={icons.deleteIcon} onClick={onRemoveClick}>Remove</CommandBarButton>
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
    await Api.azureAd.removeLink(external.userAzureAdId);
    onRemoved();
  }, [external, onRemoved]);

  return (
    <div className={identityStyles.card}>
      <div className={identityStyles.preview}>
        <div className={identityStyles.previewIconWrapper}>
          <FontAwesomeIcon icon={identityIcons.azureAd} size="3x" />
        </div>
        <Text variant="large" block className={identityStyles.previewTitle}>Azure AD</Text>
      </div>
      <div className={identityStyles.details}>
        <div className={identityStyles.detailsToolbar}>
          <CommandBarButton className={identityStyles.detailsToolbarLast} iconProps={icons.deleteIcon} text="Remove" onClick={onRemoveLinkClick} />
        </div>
        <div></div>
        <div className={identityStyles.detailsInformation}>
          <div className={identityStyles.detailsBox}>
            <Text className={identityStyles.boxTitle} block variant="small">Name</Text>
            <Text className={identityStyles.boxText} block variant="small">{external.displayName}</Text>
          </div>
          <div className={identityStyles.detailsBox}>
            <Text className={identityStyles.boxTitle} block variant="small">Email</Text>
            <Text className={identityStyles.boxText} block variant="small">{external.email}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfilePageInner: FunctionComponent<{ profile: Profile, setProfile: (newProfile: Profile) => void, azureAdAccountLinks: AccountLink[], setAzureAdAccountLinks: (newLinks: AccountLink[]) => void }> = ({ profile, setProfile, azureAdAccountLinks, setAzureAdAccountLinks }) => {
  const { isSubmitting, isValidating } = useFormStateRefs();
  const { handleSubmit, reset } = useFormContext<PageFormType>();
  const setPasswordDlg = useRef<DialogControlType | null>(null);
  const snackbar = useSnackbar();
  const saveErrorDlg = useRef<ErrorCalloutControl | null>(null);
  const isDirty = useDirtyReactHookForm();
  const history = useHistory();
  const authManager = useAuthenticationManager();
  const spaConfig = useSpaConfiguration();

  const initialTab = useMemo<"profile" | "login">(() => {
    let search = new URLSearchParams(window.location.search);
    let activeTab = search.get("activeTab")?.toLowerCase();
    if (activeTab === "login") return "login";
    else return "profile";
  }, []);

  const [selectedTab, setSelectedTab] = useState<"profile" | "login">(initialTab);

  const onTabChange: (item?: PivotItem, ev?: MouseEvent<HTMLElement>) => void = useCallback((item, _ev) => {
    if (item == null || item.props.itemKey == null) throw new Error("Unable to find tab key.");

    if (item.props.itemKey === "login") {
      setSelectedTab("login");
      history.replace(`/profile?activeTab=${item.props.itemKey}`);
    } else {
      setSelectedTab("profile");
      history.replace(`/profile`);
    }
  }, [history, setSelectedTab]);

  useEffect(() => {
    reset({ givenName: profile.givenName ?? "", surname: profile.surname ?? "", displayName: profile.displayName, email: profile.email ?? "" });
  }, [profile, reset]);

  const onConfirmClick = useCallback(async () => {
    if (profile.email == null) throw new Error("email cannot be null, undefined, or empty.");

    await Api.profile.sendConfirmationEmail(profile.email);
    snackbar.open("Confirmation email sent.");
  }, [profile, snackbar]);

  const onSubmitValid = useCallback<SubmitHandler<PageFormType>>(async ({ givenName, surname, displayName, email }) => {
    let saved: Profile = await Api.profile.updateProfile({ ...profile, givenName: isNonEmptyString(givenName) ? givenName.trim() : null, surname: isNonEmptyString(surname) ? surname.trim() : null, displayName: displayName.trim(), email: isNonEmptyString(email) ? email.trim() : null });

    setProfile(saved);
    reset({ givenName: saved.givenName ?? "", surname: saved.surname ?? "", displayName: saved.displayName, email: saved.email ?? "" });
    snackbar.open(`Profile saved.`);
  }, [profile, setProfile, reset, snackbar]);

  const onSubmitInvalid = useCallback<SubmitErrorHandler<PageFormType>>(() => {
    saveErrorDlg.current?.open(5000);
  }, []);

  const onSaveClick = useCallback(() => {
    // Don't try to save if there is currently a save or validation in progress.
    if (isSubmitting.current || isValidating.current) {
      return;
    }

    handleSubmit<PageFormType>(
      (data, event) => onSubmitValid(data, event),
      (errors, event) => onSubmitInvalid(errors, event)
    )();
  }, [handleSubmit, onSubmitValid, onSubmitInvalid, isSubmitting, isValidating]);

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
      menuProps.items.push({ key: "password", text: "Password", onClick: onAddPasswordClick, onRenderContent: (props, { renderItemName: ItemName }) => { return (<><FontAwesomeIcon icon={identityIcons.password} size="lg" fixedWidth color={AppTheme.palette.themePrimary} />{ItemName(props)}</>); } });
    }
    // Multiple Azure AD accounts can be mapped to 1 application user, so continue to show this option as long as the auth method is enabled.
    if (spaConfig.authMethods.indexOf(AuthenticationMethodType.AzureAd) >= 0) {
      menuProps.items.push({ key: "azureAd", text: "Azure AD", onClick: onAddAzureClick, onRenderContent: (props, { renderItemName: ItemName }) => { return (<><FontAwesomeIcon icon={identityIcons.azureAd} size="lg" fixedWidth color={AppTheme.palette.themePrimary} />{ItemName(props)}</>); } });
    }

    return menuProps;
  }, [onAddPasswordClick, onAddAzureClick, profile, spaConfig]);

  const setProfileUpdated = useCallback((newProfile: Profile) => {
    setProfile(newProfile);
  }, [setProfile]);

  return (
    <div className={pageStyles.page}>
      <form className={pageStyles.editForm} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <Pivot onLinkClick={onTabChange} selectedKey={selectedTab} defaultSelectedKey={selectedTab}>
          <PivotItem key="profile" itemKey="profile" headerText="Profile">
            <Stack horizontal className={`${pageStyles.toolbar2} ${pageStyles.profileToolbar}`} horizontalAlign="space-between" reversed>
              <PrimaryButton id="btnSave" text="Save" onClick={onSaveClick} iconProps={icons.saveIcon} disabled={!isDirty} /><ErrorCallout target="#btnSave" control={saveErrorDlg}><Text variant="small">Error: Unable to save.</Text></ErrorCallout>
            </Stack>
            <div className={pageStyles.profileTab}>
              <div className={`${pageStyles.row}`}>
                <Controller name="email" render={({ field, fieldState }) => <TextField className={pageStyles.col1} label="Email" type="email" autoComplete="email" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
                {profile.isEmailConfirmed || !isNonEmptyString(profile.email) ? (<></>) : (<PrimaryButton className={pageStyles.col2} onClick={onConfirmClick}>Confirm email</PrimaryButton>)}
              </div>
              <div className={`${pageStyles.row}`}>
                <Controller name="displayName" rules={{ required: true }} render={({ field, fieldState }) => <TextField className={pageStyles.col1} label="Display name" required autoComplete="name" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
              </div>
              <div className={`${pageStyles.row}`}>
                <Controller name="givenName" render={({ field, fieldState }) => <TextField className={pageStyles.col1} label="First name" autoComplete="given-name" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
              </div>
              <div className={`${pageStyles.row}`}>
                <Controller name="surname" render={({ field, fieldState }) => <TextField className={pageStyles.col1} label="Last name" autoComplete="family-name" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
              </div>
            </div>
          </PivotItem>
          <PivotItem key="login" itemKey="login" headerText="Login">
            <Stack horizontal className={`${pageStyles.toolbar2} ${pageStyles.identityToolbar}`} horizontalAlign="space-between" reversed>
              <CommandBarButton iconProps={icons.addIcon} text="New login" menuProps={addIdentityMenuProps} primary />
            </Stack>
            {profile.hasPassword ? (<PasswordIdentityCard profile={profile} setProfileUpdated={setProfileUpdated} />) : null}
            {azureAdAccountLinks.map((external) => (<AzureAdIdentityCard key={external.userAzureAdId} profile={profile} external={external} onRemoved={onAzureAdAcccountLinkRemoved} />))}
            <PasswordSetDialog dialogControl={setPasswordDlg} setProfileUpdated={setProfileUpdated} />
          </PivotItem>
        </Pivot>
      </form>
    </div>
  );
}

const ProfilePageDeps: FunctionComponent<{}> = () => {
  const formMethods = useForm<PageFormType>({ defaultValues: { givenName: "", surname: "", displayName: "", email: "" } });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [azureAdAccountLinks, setAzureAdAccountLinks] = useState<AccountLink[]>([]);

  useTitleEffect("Profile");
  useInitializationEffect(setProfile, setAzureAdAccountLinks);

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        {(profile != null) && (<ProfilePageInner profile={profile} setProfile={setProfile} azureAdAccountLinks={azureAdAccountLinks} setAzureAdAccountLinks={setAzureAdAccountLinks} />)}
      </FormProvider>
    </DirtyProvider>
  );
}

const ProfilePage = withRequiredPolicy(ProfilePageDeps, PolicyType.ReadOnlyUser);

export default ProfilePage;
