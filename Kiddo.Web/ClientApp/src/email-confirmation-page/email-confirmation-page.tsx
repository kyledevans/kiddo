import { useCallback, FormEventHandler, useEffect, useState, FunctionComponent, ReactElement } from "react";
import { mergeStyleSets, PrimaryButton, TextField, Text } from "@fluentui/react";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler } from "react-hook-form";

import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { useFormStateRefs } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { RouterPrimaryLinkButton } from "../common/router-link";
import { Api } from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentProfile } from "../common/current-profile";
import { isNonEmptyString } from "../common/helper-functions";

interface PageFormType {
  email: string;
  token: string;
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
  },
});

const EmailConfirmationPageInner: FunctionComponent<{ setConfirmState: (newConfirmState: "confirm" | "success") => void }> = ({ setConfirmState }) => {
  const isDirty = useDirtyReactHookForm();
  const [me] = useCurrentProfile();
  const { handleSubmit, reset: resetForm } = useFormContext<PageFormType>();
  const { isSubmitting, isValidating } = useFormStateRefs();
  const [isEmailRequired, setIsEmailRequired] = useState<boolean>(false);

  useEffect(() => {
    let params = new URLSearchParams(window.location.search);
    if (params.has("token")) {
      let token = params.get("token");
      if (typeof token === "string") {
        resetForm({ token: token }, { keepDefaultValues: false });
      }
    }
  }, [resetForm]);

  const onSubmitValid: SubmitHandler<PageFormType> = useCallback(async ({ email, token }) => {
    if (me == null) throw new Error("me cannot be null or undefined."); // Either logged in or anonymous (with a provided email address) are required.

    let response = await Api.profile.confirmEmail(isNonEmptyString(email) ? email : null, token);

    if (response.success) {
      setConfirmState("success");
    }

    return;
  }, [me, setConfirmState]);

  const onSubmitInvalid: SubmitErrorHandler<PageFormType> = useCallback((errors, _ev) => { }, []);

  const onSubmit: FormEventHandler = useCallback((event) => {
    event?.preventDefault();

    // Don't try to save if there is currently a save or validation in progress.
    if (isSubmitting.current || isValidating.current) {
      return;
    }

    handleSubmit<PageFormType>(
      (data, event) => onSubmitValid(data, event),
      (errors, event) => onSubmitInvalid(errors, event)
    )();
  }, [handleSubmit, isSubmitting, isValidating, onSubmitInvalid, onSubmitValid]);

  useEffect(() => {
    (async () => {
      if (me == null) {
        setIsEmailRequired(false);
      } else if (me === "Anonymous" || me === "Unregistered") {
        setIsEmailRequired(true);
      } else if (me != null) {
        setIsEmailRequired(false);
        await handleSubmit((data, event) => onSubmitValid(data, event), (errors, event) => onSubmitInvalid(errors, event))();
      }
    })();
  }, [me, handleSubmit, onSubmitValid, onSubmitInvalid]);

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="xxLargePlus">Email Confirmation</Text>
      <form className={pageStyles.registerContainer} onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        {!isEmailRequired ? (<></>) : (
          <>
            <div className={pageStyles.textContainer}>
              <Controller name="email" rules={{ required: isEmailRequired }} render={({ field, fieldState }) => <TextField label="Email" type="email" autoFocus required={isEmailRequired} autoComplete="username" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={256} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
            </div>
            <div className={pageStyles.registerBtnContainer}>
              <PrimaryButton type="submit" text="Confirm" disabled={!isDirty} />
            </div>
          </>
        )}
      </form>
    </div>
  );
}

const EmailConfirmationPage: FunctionComponent = () => {
  const formMethods = useForm<PageFormType>({ defaultValues: { email: "", token: "" } });

  const [confirmState, setConfirmStateInternal] = useState<"confirm" | "success" | null>(null);
  const [me] = useCurrentProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let search = new URLSearchParams(location.search);
    let confirmState = search.get("confirmState")?.toLowerCase();
    setConfirmStateInternal(confirmState === "success" ? "success" : "confirm");
  }, [setConfirmStateInternal, location]);

  const setConfirmState = useCallback((newConfirmState: "confirm" | "success") => {
    if (newConfirmState === "success") {
      navigate("/email-confirmation?confirmState=success", { replace: true });
    } else {
      navigate("/email-confirmation");
      throw new Error("Token was lost on redirect");  // TODO: Preserve the confirmation token in this redirect.
    }
    setConfirmStateInternal(newConfirmState);
  }, [setConfirmStateInternal, navigate]);

  useTitleEffect("Email Confirmation");

  let displayContents: ReactElement;

  if (me == null) {
    displayContents = (<></>);
  } else if (confirmState === "confirm") {
    displayContents = (
      <DirtyProvider>
        <FormProvider {...formMethods}>
          <EmailConfirmationPageInner setConfirmState={setConfirmState} />
        </FormProvider>
      </DirtyProvider>
    );
  } else if (confirmState === "success") {
    displayContents = (
      <div className={pageStyles.page}>
        <Text className={pageStyles.header} block variant="xxLargePlus">Confirmation Success!</Text>
        <RouterPrimaryLinkButton className={pageStyles.successLoginButton} to="/password-login">Login</RouterPrimaryLinkButton>
      </div>
    );
  } else {
    displayContents = (<></>);
  }

  return displayContents;
}

export default EmailConfirmationPage;
