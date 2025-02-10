import { FunctionComponent, useCallback, useEffect, MutableRefObject, FormEventHandler } from "react";
import { DialogType, DialogContent, IDialogContentProps, IModalProps, Dialog, DialogFooter, DefaultButton, PrimaryButton, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler } from "react-hook-form";

import { Api } from "../api/api";
import { Profile } from "../api/profile";
import { isNonEmptyString } from "../common/helper-functions";
import { useFormStateRefs, useReactHookFormSubmitHandlers } from "../common/hooks";
import { useSnackbar } from "../common/snackbar";
import { useCurrentProfile } from "../common/current-profile";

export type DialogControlType = { open: () => void };
type PasswordChangeFormType = { currentPassword: string, newPassword: string, newPasswordConfirm: string };

const modalProps: IModalProps = {
  isBlocking: true
};

const passwordChangeDialogProps: IDialogContentProps = {
  type: DialogType.normal,
  title: "Change password"
};

const passwordSetDialogProps: IDialogContentProps = {
  type: DialogType.normal,
  title: "Set password"
};

const passwordResetDialogProps: IDialogContentProps = {
  type: DialogType.normal,
  title: "Reset password"
};

const passwordRemoveDialogProps: IDialogContentProps = {
  type: DialogType.normal,
  title: "Remove password"
};

export const PasswordResetDialog: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null> }> = ({ dialogControl }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const [me] = useCurrentProfile();
  const snackbar = useSnackbar();

  useEffect(() => {
    const newControl: DialogControlType = {
      open: setIsDialogVisible
    };
    dialogControl.current = newControl;
  }, [dialogControl, setIsDialogVisible]);

  const sendPasswordResetClick = useCallback(async () => {
    if (me == null || me === "Anonymous" || me === "Unregistered") return;

    if (!isNonEmptyString(me.email)) throw new Error("Unable to reset email because the user's email address is null or empty.")

    await Api.identity.sendPasswordReset(me.email);
    setIsDialogHidden();
    snackbar.open("Password reset email sent.");
  }, [me, setIsDialogHidden, snackbar]);

  return (
    <Dialog hidden={isDialogHidden} onDismiss={setIsDialogHidden} dialogContentProps={passwordResetDialogProps} modalProps={modalProps}>
      <DialogContent>Send password reset email?</DialogContent>
      <DialogFooter>
        <PrimaryButton type="button" onClick={sendPasswordResetClick} text="Send password reset" />
        <DefaultButton type="button" onClick={setIsDialogHidden} text="Cancel" />
      </DialogFooter>
    </Dialog>
  );
}

export const PasswordRemoveDialog: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null>, setProfileUpdated: (newProfile: Profile) => void }> = ({ dialogControl, setProfileUpdated }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const [me] = useCurrentProfile();
  const snackbar = useSnackbar();

  useEffect(() => {
    const newControl: DialogControlType = {
      open: setIsDialogVisible
    };
    dialogControl.current = newControl;
  }, [dialogControl, setIsDialogVisible]);

  const removePasswordClick = useCallback(async () => {
    if (me == null || me === "Anonymous" || me === "Unregistered") return;

    await Api.identity.removePassword();
    setIsDialogHidden();
    snackbar.open("Password has been removed.");
    const newProfile = await Api.profile.getProfile();
    if (newProfile == null) throw new Error("Cannot proceed because the new profile is somehow null.");
    setProfileUpdated(newProfile);
  }, [me, setIsDialogHidden, snackbar, setProfileUpdated]);

  return (
    <Dialog hidden={isDialogHidden} onDismiss={setIsDialogHidden} dialogContentProps={passwordRemoveDialogProps} modalProps={modalProps}>
      <DialogContent>Remove password?</DialogContent>
      <DialogFooter>
        <PrimaryButton type="button" onClick={removePasswordClick} text="Remove password" />
        <DefaultButton type="button" onClick={setIsDialogHidden} text="Cancel" />
      </DialogFooter>
    </Dialog>
  );
}

export const PasswordChangeDialog: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null> }> = ({ dialogControl }) => {
  const formMethods = useForm<PasswordChangeFormType>({ defaultValues: { currentPassword: "", newPassword: "", newPasswordConfirm: "" } });

  return (
    <FormProvider {...formMethods}>
      <PasswordChangeDialogInner dialogControl={dialogControl} />
    </FormProvider>
  );
}

const PasswordChangeDialogInner: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null> }> = ({ dialogControl }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const { handleSubmit, reset } = useFormContext<PasswordChangeFormType>();
  const { isSubmitting, isValidating } = useFormStateRefs();
  const snackbar = useSnackbar();

  const open = useCallback(() => {
    setIsDialogVisible();
  }, [setIsDialogVisible]);

  useEffect(() => {
    const newControl: DialogControlType = {
      open
    };
    dialogControl.current = newControl;
  }, [dialogControl, open]);

  const onResetSubmitValid: SubmitHandler<PasswordChangeFormType> = useCallback(async ({ currentPassword, newPassword }) => {
    await Api.identity.changePassword(currentPassword, newPassword);
    setIsDialogHidden();
    snackbar.open("Password changed.");
    reset();
  }, [setIsDialogHidden, snackbar, reset]);

  const onResetSubmitInvalid: SubmitErrorHandler<PasswordChangeFormType> = useCallback((errors, _ev) => { }, []);

  const onSubmit = useReactHookFormSubmitHandlers(onResetSubmitValid, onResetSubmitInvalid);

  return (
    <Dialog hidden={isDialogHidden} onDismiss={setIsDialogHidden} dialogContentProps={passwordChangeDialogProps} modalProps={modalProps}>
      <form onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <Controller name="currentPassword" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Current password" type="password" canRevealPassword required autoComplete="current-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        <Controller name="newPassword" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="New password" type="password" canRevealPassword required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        <Controller name="newPasswordConfirm" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Confirm new password" type="password" canRevealPassword required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        <DialogFooter>
          <PrimaryButton type="submit" text="Change password" />
          <DefaultButton type="button" onClick={setIsDialogHidden} text="Cancel" />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export const PasswordSetDialog: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null>, setProfileUpdated: (newProfile: Profile) => void }> = ({ dialogControl, setProfileUpdated }) => {
  const formMethods = useForm<PasswordChangeFormType>({ defaultValues: { newPassword: "", newPasswordConfirm: "" } });

  return (
    <FormProvider {...formMethods}>
      <PasswordSetDialogInner dialogControl={dialogControl} setProfileUpdated={setProfileUpdated} />
    </FormProvider>
  );
}

const PasswordSetDialogInner: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null>, setProfileUpdated: (newProfile: Profile) => void }> = ({ dialogControl, setProfileUpdated }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const { handleSubmit, reset } = useFormContext<{ newPassword: string, newPasswordConfirm: string }>();
  const { isSubmitting, isValidating } = useFormStateRefs();
  const snackbar = useSnackbar();

  const open = useCallback(() => {
    setIsDialogVisible();
  }, [setIsDialogVisible]);

  useEffect(() => {
    const newControl: DialogControlType = {
      open
    };
    dialogControl.current = newControl;
  }, [dialogControl, open]);

  const onResetSubmitValid: SubmitHandler<{ newPassword: string, newPasswordConfirm: string }> = useCallback(async ({ newPassword }) => {
    await Api.identity.setPassword(newPassword);
    setIsDialogHidden();
    snackbar.open("Password set.");
    reset();
    const newProfile = await Api.profile.getProfile();
    if (newProfile == null) throw new Error("Cannot proceed because the current profile was somehow null.");
    setProfileUpdated(newProfile);
  }, [setIsDialogHidden, snackbar, reset, setProfileUpdated]);

  const onResetSubmitInvalid: SubmitErrorHandler<{ newPassword: string, newPasswordConfirm: string }> = useCallback((errors, _ev) => { }, []);

  const onSubmit = useReactHookFormSubmitHandlers(onResetSubmitValid, onResetSubmitInvalid);

  return (
    <Dialog hidden={isDialogHidden} onDismiss={setIsDialogHidden} dialogContentProps={passwordSetDialogProps} modalProps={modalProps}>
      <form onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <Controller name="newPassword" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="New password" type="password" canRevealPassword required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        <Controller name="newPasswordConfirm" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Confirm new password" type="password" canRevealPassword required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        <DialogFooter>
          <PrimaryButton type="submit" text="Set password" />
          <DefaultButton type="button" onClick={setIsDialogHidden} text="Cancel" />
        </DialogFooter>
      </form>
    </Dialog>
  );
}
