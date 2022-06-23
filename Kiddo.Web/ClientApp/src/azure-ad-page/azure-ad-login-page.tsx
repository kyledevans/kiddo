import { useCallback, FormEventHandler, useEffect } from "react";
import { mergeStyleSets, IIconProps, PrimaryButton, TextField, Text } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler, UseFormSetValue, UseFormReset } from "react-hook-form";
import { useNavigate } from "react-router";

import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { useFormStateRefs, useReactHookFormSubmitHandlers } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { RouterDefaultLinkButton } from "../common/router-link";
import { useAuthenticationManager, useAuthenticationManagerState } from "../common/authentication-react";
import { AzureAdAuthenticator } from "../common/azure-ad-authenticator";
import { Api } from "../api/api";
import { useSpaConfiguration } from "../common/spa-configuration";
import { AuthenticationManagerStateType, AuthenticationMethodType, IAuthenticationManager } from "../common/authentication";
import { SpaConfiguration } from "../api/app";
import { RegisterStatusCodeType } from "../api/azure-ad";
import { useSnackbar } from "../common/snackbar";
import { useCurrentProfile } from "../common/current-profile";
import { AppName } from "../common/constants";

interface PageFormType {
  email: string;
  displayName: string;
  givenName: string;
  surname: string;
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
  },
});

const icons: { backLoginIcon: IIconProps } = {
  backLoginIcon: { iconName: "Back" }
};

function useInitializeEffect(authManager: IAuthenticationManager | null, spaConfig: SpaConfiguration | null, authState: AuthenticationManagerStateType | null, setFormValue: UseFormSetValue<PageFormType>, showRegisterForm: () => void, reset: UseFormReset<PageFormType>) {
  const snackbar = useSnackbar();
  const [me] = useCurrentProfile();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (authState !== AuthenticationManagerStateType.Running || me == null) return;

      if (authManager == null) throw new Error("authManager should not possibly be null here.");

      // User is logged into Azure AD, but may not yet be registered with our backend application.
      if (me === "Anonymous") {
        // User is not logged into Azure AD yet.

        let authenticator = authManager.getAuthenticator<AzureAdAuthenticator>(AuthenticationMethodType.AzureAd);
        if (authenticator == null) throw new Error("Cannot proceed because Azure Ad is disabled.");
        await authenticator.login(true);
      } else if (me === "Unregistered") {
        const registerResponse = await Api.azureAd.register();

        if (registerResponse.statusCode === RegisterStatusCodeType.Success) {
          // Newly registered.
          snackbar.open("Registered!");
          reset();
          navigate("/");
        } else if (registerResponse.statusCode === RegisterStatusCodeType.AlreadyRegistered) {
          // User is already registered.  Silently redirect them away from the login page.
          reset();
          navigate("/");
        } else if (registerResponse.statusCode === RegisterStatusCodeType.InvalidFields) {
          // The user needs to register, but some of their profile data doesn't pass validation.  Prompt to manually enter some details.
          setFormValue("email", registerResponse?.prefillData?.email ?? "");
          setFormValue("displayName", registerResponse?.prefillData?.displayName ?? "");
          setFormValue("givenName", registerResponse?.prefillData?.givenName ?? "");
          setFormValue("surname", registerResponse?.prefillData?.surname ?? "");
          showRegisterForm();
        }
      }
    })();
  }, [authManager, spaConfig, authState, setFormValue, showRegisterForm, navigate, me, snackbar, reset]);
}

function LoginPageInner() {
  const isDirty = useDirtyReactHookForm();
  const { handleSubmit, setValue, reset } = useFormContext<PageFormType>();
  const { isSubmitting, isValidating } = useFormStateRefs();
  const authManager = useAuthenticationManager();
  const spaConfig = useSpaConfiguration();
  const authState = useAuthenticationManagerState();
  const [isRegisterFormVisible, { setTrue: showRegisterForm }] = useBoolean(false);

  useInitializeEffect(authManager, spaConfig, authState, setValue, showRegisterForm, reset);

  const onSubmitValid: SubmitHandler<PageFormType> = useCallback(async ({ displayName, email, givenName, surname }) => {
    if (authManager == null) throw new Error("authManager cannot be null.");

    const authenticator = authManager.authenticator instanceof AzureAdAuthenticator ? authManager.authenticator : null;
    if (authenticator == null) return;  // Don't do anything if the current authentication is not Azure Ad.

    let regResponse;

    regResponse = await Api.azureAd.registerManual({ displayName, email, givenName, surname });

    if (regResponse.statusCode === RegisterStatusCodeType.Success) {
      reset();
      window.location.assign("/");
    }
  }, [authManager, reset]);

  const onSubmitInvalid: SubmitErrorHandler<PageFormType> = useCallback((errors, _ev) => { }, []);

  const onSubmit = useReactHookFormSubmitHandlers(onSubmitValid, onSubmitInvalid);

  const RegisterForm = (
    <form className={pageStyles.registerContainer} onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
      <div className={pageStyles.textContainer}>
        <Controller name="email" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Email" type="email" required autoComplete="username" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={256} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
      </div>
      <div className={pageStyles.textContainer}>
        <Controller name="displayName" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Display name" required autoComplete="name" autoCorrect="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
      </div>
      <div className={pageStyles.textContainer}>
        <Controller name="givenName" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="First name" required autoComplete="given-name" autoCorrect="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
      </div>
      <div className={pageStyles.textContainer}>
        <Controller name="surname" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Last name" required autoComplete="family-name" autoCorrect="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
      </div>
      <div className={pageStyles.registerBtnContainer}>
        <PrimaryButton type="submit" text="Register" disabled={!isDirty} />
      </div>
      <div className={pageStyles.extraContainer}>
        <div className={pageStyles.btnBackLoginContainer}><RouterDefaultLinkButton to="/authentication" className={pageStyles.btnBackLogin} tabIndex={-1} iconProps={icons.backLoginIcon}>Login</RouterDefaultLinkButton></div>
      </div>
    </form>
  );

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="xxLargePlus">{AppName} Registration</Text>
      {(isRegisterFormVisible ? RegisterForm : null)}
    </div>
  );
}

function LoginPage() {
  const formMethods = useForm<PageFormType>({
    defaultValues: { email: "", displayName: "", givenName: "", surname: "" },
    mode: "onTouched"
  });

  useTitleEffect("Login");

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        <LoginPageInner />
      </FormProvider>
    </DirtyProvider>
  );
}

export default LoginPage;
