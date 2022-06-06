import { FunctionComponent, useCallback, useState, useEffect, useRef } from "react";
import { CommandBarButton, mergeStyleSets, IIconProps, PrimaryButton, Text, TextField } from "@fluentui/react";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler } from "react-hook-form";

import { Api } from "../api/api";
import { Profile } from "../api/profile";
import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { isNonEmptyString } from "../common/helper-functions";
import { useFormStateRefs } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { useSnackbar } from "../common/snackbar";
import { ErrorCallout, ErrorCalloutControl } from "../common/error-callout";
import { PolicyType, withRequiredPolicy } from "../common/current-authorization";
import { NavigatorContainer } from "./navigator";
import { Toolbar, ToolbarColumn3 } from "../common/toolbar";

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
  toolbar2: {
    height: 44,
    margin: "0 16px"
  },
  btnDelete: {
    marginRight: 32
  },
  btnSave: {
    paddingRight: 16
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

const icons: { save: IIconProps, delete: IIconProps, add: IIconProps } = {
  save: { iconName: "Save" },
  delete: { iconName: "Delete" },
  add: { iconName: "Add" }
};

function useInitializationEffect(setProfile: (newProfile: Profile) => void) {
  useEffect(() => {
    (async () => {
      const profile = await Api.profile.getProfile();

      if (profile == null) throw new Error("profile cannot be null or undefined.");

      setProfile(profile);
    })();
  }, [setProfile]);
}

const ProfilePageInner: FunctionComponent<{ profile: Profile, setProfile: (newProfile: Profile) => void }> = ({ profile, setProfile }) => {
  const { isSubmitting, isValidating } = useFormStateRefs();
  const { handleSubmit, reset } = useFormContext<PageFormType>();
  const snackbar = useSnackbar();
  const saveErrorDlg = useRef<ErrorCalloutControl | null>(null);
  const isDirty = useDirtyReactHookForm();

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

  return (
    <NavigatorContainer>
      <div className={pageStyles.page}>
        <Toolbar>
          <ToolbarColumn3>
            <CommandBarButton id="btnSave" className={pageStyles.btnSave} text="Save" onClick={onSaveClick} iconProps={icons.save} disabled={!isDirty} /><ErrorCallout target="#btnSave" control={saveErrorDlg}><Text variant="small">Error: Unable to save.</Text></ErrorCallout>
          </ToolbarColumn3>
        </Toolbar>
        <form className={pageStyles.editForm} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
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
        </form>
      </div>
    </NavigatorContainer>
  );
}

const ProfilePageDeps: FunctionComponent<{}> = () => {
  const formMethods = useForm<PageFormType>({ defaultValues: { givenName: "", surname: "", displayName: "", email: "" } });
  const [profile, setProfile] = useState<Profile | null>(null);

  useTitleEffect("Profile");
  useInitializationEffect(setProfile);

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        {(profile != null) && (<ProfilePageInner profile={profile} setProfile={setProfile} />)}
      </FormProvider>
    </DirtyProvider>
  );
}

const ProfilePage = withRequiredPolicy(ProfilePageDeps, PolicyType.ReadOnlyUser);

export default ProfilePage;
