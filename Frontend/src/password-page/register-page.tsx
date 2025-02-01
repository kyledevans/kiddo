import { useCallback, useState, useEffect, ReactElement, FunctionComponent, useRef } from "react";
import { mergeStyleSets, IIconProps, PrimaryButton, TextField, Text, Spinner } from "@fluentui/react";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";

import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { DebounceValidator, useDebouncedValidator, usePasswordValidators, useReactHookFormSubmitHandlers } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { RouterDefaultLinkButton, RouterPrimaryLinkButton } from "../common/router-link";
import { Api } from "../api/api";
import { PasswordValidationRules } from "../api/identity";
import { PasswordAuthenticator } from "../common/password-authenticator";
import { useAuthenticationManager } from "../common/authentication-react";
import { AppName } from "../common/constants";
import { useCurrentProfile } from "../common/current-profile";
import { PasswordRules } from "../common/password-rules";

interface PageFormType {
  email: string;
  displayName: string;
  givenName: string;
  surname: string;
  password: string;
  confirmPassword: string;
}

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content min-content 1fr",
    overflow: "hidden",
    justifyItems: "center"
  },
  header: {
    margin: "50px 0 50px 0"
  },
  successLoginButton: {
    width: 450,
    marginTop: 50
  },
  registerContainer: {
    display: "flex",
    flexDirection: "column",
    width: 450
  },
  textContainer: {
    display: "grid",
    flex: "1 0 0"
  },
  passwordContainer: {
    display: "grid",
    flex: "1 0 0"
  },
  registerBtnContainer: {
    display: "grid",
    flex: "1 0 0",
    paddingTop: 24
  },
  extraContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content",
    paddingTop: 48
  },
  btnBackLoginContainer: {
  },
  btnBackLogin: {
    justifySelf: "start",
    whiteSpace: "nowrap"
  }
});

const icons: { backLoginIcon: IIconProps, checkmark: IIconProps } = {
  backLoginIcon: { iconName: "Back" },
  checkmark: { iconName: "CheckMark" }
};

const RegisterPageInner: FunctionComponent<{ setRegisterState: (newRegisterState: "register" | "success") => void }> = ({ setRegisterState }) => {
  const isDirty = useDirtyReactHookForm();
  const { reset: resetForm, setError } = useFormContext<PageFormType>();
  const navigate = useNavigate();
  const authManager = useAuthenticationManager();
  const [rules, setRules] = useState<PasswordValidationRules | null>(null);
  const { passwordValidator, confirmPasswordValidator } = usePasswordValidators<PageFormType>(rules, "password");
  const [isEmailValidating, setIsEmailValidating] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const newRules = await Api.identity.getPasswordValidationRules();
      setRules(newRules);
    })();
  }, [setRules]);

  const onSubmitValid: SubmitHandler<PageFormType> = useCallback(async ({ email, displayName, givenName, surname, password }) => {
    if (authManager == null) throw new Error("authManager cannot be null or undefined.");

    let authenticator = new PasswordAuthenticator(null, authManager);
    let response = await authenticator.register(email, password, displayName, givenName, surname);
    if (response.success && response.authenticateResponse != null) {
      resetForm();
      navigate("/");
      window.setTimeout(() => { window.location.reload(); });
    } else if (response.success) {
      resetForm();
      setRegisterState("success");
    }
  }, [authManager, resetForm, navigate, setRegisterState]);

  const onSubmit = useReactHookFormSubmitHandlers(onSubmitValid);

  const validateEmailAsyncAborter = useRef<AbortController | null>(null);
  const validateEmailAsync: DebounceValidator<string> = useCallback(async (debounce, value) => {
    validateEmailAsyncAborter.current?.abort(); // Abort pending ajax validation.
    setError("email", {});  // Clear current errors.
    setIsEmailValidating(true);

    try {
      await debounce;
    } catch (ex) {
      return true;
    }

    validateEmailAsyncAborter.current = new AbortController();

    try {
      const result = await Api.profile.validateEmailForRegistration(value, validateEmailAsyncAborter.current.signal);
      setIsEmailValidating(false);
      if (result.isValid) return true;
      else if (result.errorCode === "InvalidEmail") return "Invalid address.";
      else if (result.errorCode === "EmailTaken") return "Already in use.";
      else if (result.errorCode == null) return "Unknown error.";
      else return result.errorCode;
    } catch (ex) {
      setIsEmailValidating(false);
      if (!(ex instanceof DOMException && ex.name === "AbortError")) {
        throw ex;
      }
      return false;
    }
  }, [validateEmailAsyncAborter, setError]);

  const validateEmail = useDebouncedValidator(validateEmailAsync);

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="xxLargePlus">{AppName} Registration</Text>
      <form className={pageStyles.registerContainer} onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <div className={pageStyles.textContainer}>
          <Controller name="email" rules={{ required: true, validate: validateEmail }} render={({ field, fieldState, formState }) => <TextField label="Email" type="email" autoFocus required autoComplete="username" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={256} iconProps={fieldState.error?.type == null && !isEmailValidating ? icons.checkmark : undefined} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.textContainer}>
          <Controller name="displayName" rules={{ required: true }} render={({ field, fieldState }) => <div style={{ position: "relative" }}><TextField label="Display name" required autoComplete="name" autoCorrect="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />{isEmailValidating ? (<Spinner style={{ position: "absolute", right: 8, top: -43, zIndex: 1 }} />) : undefined}</div>} />
        </div>
        <div className={pageStyles.textContainer}>
          <Controller name="givenName" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="First name" required autoComplete="given-name" autoCorrect="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.textContainer}>
          <Controller name="surname" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Last name" required autoComplete="family-name" autoCorrect="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.passwordContainer}>
          <Controller name="password" rules={{ required: true, validate: passwordValidator }} render={({ field, fieldState }) => <TextField label="Password" type="password" required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} iconProps={!fieldState.invalid ? icons.checkmark : undefined} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.passwordContainer}>
          <Controller name="confirmPassword" rules={{ required: true, validate: confirmPasswordValidator }} render={({ field, fieldState }) => <TextField label="Confirm password" type="password" required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} iconProps={!fieldState.invalid ? icons.checkmark : undefined} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.registerBtnContainer}>
          <PrimaryButton type="submit" text="Register" disabled={!isDirty} />
        </div>
        <div className={pageStyles.extraContainer}>
          <div className={pageStyles.btnBackLoginContainer}><RouterDefaultLinkButton to="/password-login" className={pageStyles.btnBackLogin} tabIndex={-1} iconProps={icons.backLoginIcon}>Login</RouterDefaultLinkButton></div>
        </div>
        <PasswordRules rules={rules} />
      </form>
    </div>
  );
}

const RegisterPage: FunctionComponent = () => {
  const formMethods = useForm<PageFormType>({ defaultValues: { email: "", displayName: "", givenName: "", surname: "", password: "", confirmPassword: "" }, mode: "onChange", reValidateMode: "onChange" });

  const [registerState, setRegisterStateInternal] = useState<"register" | "success" | null>(null);
  const [me] = useCurrentProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let search = new URLSearchParams(location.search);
    let registerState = search.get("registerState")?.toLowerCase();
    setRegisterStateInternal(registerState === "success" ? "success" : "register");
  }, [setRegisterStateInternal, location]);

  const setRegisterState = useCallback((newRegisterState: "register" | "success") => {
    if (newRegisterState === "success") {
      navigate("/password-register?registerState=success", { replace: true })
    } else {
      navigate("/password-register");
    }
    setRegisterStateInternal(newRegisterState);
  }, [setRegisterStateInternal, navigate]);

  useTitleEffect("Register");

  useEffect(() => {
    if (me != null && me !== "Anonymous" && me !== "Unregistered") {
      navigate("/");
    }
  }, [me, navigate]);

  let displayContents: ReactElement;

  if (me == null) {
    displayContents = (<></>);
  } else if (me !== "Anonymous" && me !== "Unregistered") {
    displayContents = (<></>);
  } else if (registerState === "register") {
    displayContents = (
      <DirtyProvider>
        <FormProvider {...formMethods}>
          <RegisterPageInner setRegisterState={setRegisterState} />
        </FormProvider>
      </DirtyProvider>
    );
  } else if (registerState != null) {
    displayContents = (
      <div className={pageStyles.page}>
        <Text className={pageStyles.header} block variant="xxLargePlus">Registration Success!</Text>
        <Text block variant="large">Please use the confirmation email that has been sent to your address.</Text>
        <RouterPrimaryLinkButton className={pageStyles.successLoginButton} to="/password-login">Login</RouterPrimaryLinkButton>
      </div>
    );
  } else {
    displayContents = (<></>);
  }

  return displayContents;
}

export default RegisterPage;
