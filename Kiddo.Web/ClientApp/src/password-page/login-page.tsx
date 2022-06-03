import { useCallback, FormEventHandler, FunctionComponent, useEffect, useRef, MutableRefObject, useState } from "react";
import { mergeStyleSets, PrimaryButton, TextField, DefaultButton, Dialog, DialogFooter, IDialogContentProps, IModalProps, DialogType, Text, MessageBar, MessageBarType } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler } from "react-hook-form";

import { useFormStateRefs, useReactHookFormSubmitHandlers } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { RouterDefaultLinkButton } from "../common/router-link";
import { useAuthenticationManager } from "../common/authentication-react";
import { PasswordAuthenticator } from "../common/password-authenticator";
import { useHistory } from "react-router-dom";
import { Api } from "../api/api";
import { useSnackbar } from "../common/snackbar";
import { AppName } from "../common/constants";

interface PageFormType {
  email: string;
  emailReset: string;
  password: string;
}

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
  },
  loginContainer: {
    display: "flex",
    flexDirection: "column",
    width: 450
  },
  emailContainer: {
    display: "grid",
    flex: "1 0 0"
  },
  passwordContainer: {
    display: "grid",
    flex: "1 0 0"
  },
  errorContainer: {
    marginTop: 48
  },
  loginBtnContainer: {
    display: "grid",
    flex: "1 0 0",
    paddingTop: 24
  },
  extraContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "min-content",
    paddingTop: 48
  },
  btnForgotContainer: {
  },
  btnForgot: {
    justifySelf: "start",
    whiteSpace: "nowrap"
  },
  btnRegisterContainer: {
    direction: "rtl"
  },
  btnRegister: {
    justifySelf: "end",
    direction: "ltr"
  }
});

const resetDialogProps: IDialogContentProps = {
  type: DialogType.normal,
  title: "Password reset"
};

const resetModalProps: IModalProps = {
  isBlocking: true
};

function LoginPageInner() {
  const { getValues } = useFormContext<PageFormType>();
  const authManager = useAuthenticationManager();
  const history = useHistory();
  const resetDialogControl = useRef<DialogControlType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>();

  const btnForgotClick = useCallback(() => {
    const email = getValues().email;
    resetDialogControl.current?.open(email);
  }, [resetDialogControl, getValues]);

  const onLoginSubmitValid: SubmitHandler<PageFormType> = useCallback(async ({ email, password }) => {
    if (authManager == null) return;

    setErrorMessage(null);

    const authenticator = new PasswordAuthenticator(null, authManager);
    const response = await authenticator.login(email, password);

    if (response.success) {
      history.push("/");
      window.setTimeout(() => { window.location.reload(); });
    } else {
      setErrorMessage("Incorrect username or password.");
    }
  }, [authManager, history]);

  const onLoginSubmit = useReactHookFormSubmitHandlers(onLoginSubmitValid);

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="xxLargePlus">{AppName} Login</Text>
      <form className={pageStyles.loginContainer} onSubmit={onLoginSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <div className={pageStyles.emailContainer}>
          <Controller name="email" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Email" autoFocus type="email" required autoComplete="username" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={256} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        </div>
        <div className={pageStyles.passwordContainer}>
          <Controller name="password" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Password" type="password" required autoComplete="current-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        </div>
        <div className={pageStyles.loginBtnContainer}>
          <PrimaryButton type="submit" text="Login" />
        </div>
        <div className={pageStyles.errorContainer}>
          {errorMessage == null ? undefined : (<MessageBar messageBarType={MessageBarType.error} onDismiss={() => setErrorMessage(null)}>{errorMessage}</MessageBar>)}
        </div>
        <div className={pageStyles.extraContainer}>
          <div className={pageStyles.btnForgotContainer}><DefaultButton type="button" className={pageStyles.btnForgot} tabIndex={-1} onClick={btnForgotClick}>Forgot password</DefaultButton></div>
          <div className={pageStyles.btnRegisterContainer}><RouterDefaultLinkButton to="/password-register" className={pageStyles.btnRegister} tabIndex={-1}>Register</RouterDefaultLinkButton></div>
        </div>
      </form>
      <ResetDialog dialogControl={resetDialogControl} />
    </div>
  );
}

type DialogControlType = { open: (emailReset: string) => void };

const ResetDialog: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null> }> = ({ dialogControl }) => {
  const formMethods = useForm<{ emailReset: string }>({ defaultValues: { emailReset: "" } });

  return (
    <FormProvider {...formMethods}>
      <ResetDialogInner dialogControl={dialogControl} />
    </FormProvider>
  );
}

const ResetDialogInner: FunctionComponent<{ dialogControl: MutableRefObject<DialogControlType | null> }> = ({ dialogControl }) => {
  const [isDialogHidden, { setTrue: setIsDialogHidden, setFalse: setIsDialogVisible }] = useBoolean(true);
  const { handleSubmit, setValue } = useFormContext<{ emailReset: string }>();
  const { isSubmitting, isValidating } = useFormStateRefs();
  const snackbar = useSnackbar();

  const open = useCallback((emailReset: string) => {
    setValue("emailReset", emailReset);
    setIsDialogVisible();
  }, [setValue, setIsDialogVisible]);

  useEffect(() => {
    const newControl: DialogControlType = {
      open
    };
    dialogControl.current = newControl;
  }, [dialogControl, open]);

  const onResetSubmitValid: SubmitHandler<{ emailReset: string }> = useCallback(async ({ emailReset }) => {
    await Api.identity.sendPasswordReset(emailReset);
    setIsDialogHidden();
    snackbar.open("Password reset email sent.");
  }, [setIsDialogHidden, snackbar]);

  const onResetSubmitInvalid: SubmitErrorHandler<{ emailReset: string }> = useCallback((errors, _ev) => { }, []);

  const onResetSubmit: FormEventHandler = useCallback((event) => {
    event?.preventDefault();

    // Don't try to save if there is currently a save or validation in progress.
    if (isSubmitting.current || isValidating.current) {
      return;
    }

    handleSubmit<{ emailReset: string }>(
      (data, event) => onResetSubmitValid(data, event),
      (errors, event) => onResetSubmitInvalid(errors, event)
    )();
  }, [isSubmitting, isValidating, handleSubmit, onResetSubmitValid, onResetSubmitInvalid]);

  return (
    <Dialog hidden={isDialogHidden} onDismiss={setIsDialogHidden} dialogContentProps={resetDialogProps} modalProps={resetModalProps}>
      <form onSubmit={onResetSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <Controller name="emailReset" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Email" type="email" autoFocus required autoComplete="username" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={256} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        <DialogFooter>
          <PrimaryButton type="submit" text="Send password reset" />
          <DefaultButton type="button" onClick={setIsDialogHidden} text="Cancel" />
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function LoginPage() {
  const formMethods = useForm<PageFormType>({ defaultValues: { email: "", emailReset: "", password: "" } });

  useTitleEffect("Login");

  return (
    <>
      <FormProvider {...formMethods}>
        <LoginPageInner />
      </FormProvider>
    </>
  );
}

export default LoginPage;
