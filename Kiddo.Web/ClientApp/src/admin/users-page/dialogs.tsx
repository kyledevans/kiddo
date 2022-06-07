import { FunctionComponent, useCallback, useEffect, MutableRefObject, FormEventHandler, useState } from "react";
import { DialogType, DialogContent, IDialogContentProps, IModalProps, Dialog, DialogFooter, DefaultButton, PrimaryButton, TextField } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler } from "react-hook-form";

import { Api } from "../../api/api";
import { User } from "../../api/user";
import { isNonEmptyString } from "../../common/helper-functions";
import { useFormStateRefs } from "../../common/hooks";
import { useSnackbar } from "../../common/snackbar";

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

export const PasswordResetDialog: FunctionComponent<{ user: User, dialogControl: MutableRefObject<DialogControlType | null> }> = ({ user, dialogControl }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const snackbar = useSnackbar();

  useEffect(() => {
    const newControl: DialogControlType = {
      open: setIsDialogVisible
    };
    dialogControl.current = newControl;
  }, [dialogControl, setIsDialogVisible]);

  const sendPasswordResetClick = useCallback(async () => {
    if (!isNonEmptyString(user.email)) throw new Error("Unable to reset email because the user's email address is null or empty.")

    await Api.identity.sendPasswordReset(user.email);
    setIsDialogHidden();
    snackbar.open("Password reset email sent.");
  }, [user, setIsDialogHidden, snackbar]);

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

export const PasswordRemoveDialog: FunctionComponent<{ user: User, dialogControl: MutableRefObject<DialogControlType | null>, setUserUpdated: (newUser: User) => void }> = ({ user, dialogControl, setUserUpdated }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const snackbar = useSnackbar();

  useEffect(() => {
    const newControl: DialogControlType = {
      open: setIsDialogVisible
    };
    dialogControl.current = newControl;
  }, [dialogControl, setIsDialogVisible]);

  const removePasswordClick = useCallback(async () => {
    await Api.identity.removePasswordByUserId(user.userId);
    setIsDialogHidden();
    snackbar.open("Password has been removed.");
    const newUser = await Api.user.getUser(user.userId);
    setUserUpdated(newUser);
  }, [user, setIsDialogHidden, snackbar, setUserUpdated]);

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

export const PasswordSetDialog: FunctionComponent<{ user: User, dialogControl: MutableRefObject<DialogControlType | null>, setUserUpdated: (newUser: User) => void }> = ({ user, dialogControl, setUserUpdated }) => {
  const formMethods = useForm<PasswordChangeFormType>({ defaultValues: { newPassword: "", newPasswordConfirm: "" } });

  return (
    <FormProvider {...formMethods}>
      <PasswordSetDialogInner user={user} dialogControl={dialogControl} setUserUpdated={setUserUpdated} />
    </FormProvider>
  );
}

const PasswordSetDialogInner: FunctionComponent<{ user: User, dialogControl: MutableRefObject<DialogControlType | null>, setUserUpdated: (newUser: User) => void }> = ({ user, dialogControl, setUserUpdated }) => {
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
    await Api.identity.setPasswordByUserId(user.userId, newPassword);
    setIsDialogHidden();
    snackbar.open("Password set.");
    reset();
    const newUser = await Api.user.getUser(user.userId);
    setUserUpdated(newUser);
  }, [setIsDialogHidden, snackbar, reset, setUserUpdated, user]);

  const onResetSubmitInvalid: SubmitErrorHandler<{ newPassword: string, newPasswordConfirm: string }> = useCallback((errors, _ev) => { }, []);

  const onResetSubmit: FormEventHandler = useCallback((event) => {
    event?.preventDefault();

    // Don't try to save if there is currently a save or validation in progress.
    if (isSubmitting.current || isValidating.current) {
      return;
    }

    handleSubmit<{ newPassword: string, newPasswordConfirm: string }>(
      (data, event) => onResetSubmitValid(data, event),
      (errors, event) => onResetSubmitInvalid(errors, event)
    )();
  }, [isSubmitting, isValidating, handleSubmit, onResetSubmitValid, onResetSubmitInvalid]);

  return (
    <Dialog hidden={isDialogHidden} onDismiss={setIsDialogHidden} dialogContentProps={passwordSetDialogProps} modalProps={modalProps}>
      <form onSubmit={onResetSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
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
