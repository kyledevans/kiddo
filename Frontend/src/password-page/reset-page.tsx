import { useCallback, useEffect, useState } from "react";
import { mergeStyleSets, PrimaryButton, TextField, Text } from "@fluentui/react";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler } from "react-hook-form";

import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { usePasswordValidators, useReactHookFormSubmitHandlers } from "../common/hooks";
import { useTitleEffect } from "../common/title";
import { Api } from "../api/api";
import { PasswordValidationRules } from "../api/identity";
import { PasswordRules } from "../common/password-rules";

interface PageFormType {
  email: string;
  password: string;
  confirmPassword: string;
  token: string;
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

function ResetPageInner() {
  const isDirty = useDirtyReactHookForm();
  const { reset: resetForm } = useFormContext<PageFormType>();
  const [rules, setRules] = useState<PasswordValidationRules | null>(null);

  useEffect(() => {
    let params = new URLSearchParams(window.location.search);
    if (params.has("token")) {
      let token = params.get("token");
      if (typeof token === "string") {
        resetForm({ token: token }, { keepDefaultValues: false });
      }
    }
  }, [resetForm]);

  useEffect(() => {
    (async () => {
      const newRules = await Api.identity.getPasswordValidationRules();
      setRules(newRules);
    })();
  }, [setRules]);

  const onSubmitValid: SubmitHandler<PageFormType> = useCallback(async ({ email, password, token }) => {
    await Api.identity.passwordReset(email, password, token);
  }, []);

  const onSubmit = useReactHookFormSubmitHandlers(onSubmitValid);

  const { passwordValidator, confirmPasswordValidator } = usePasswordValidators<PageFormType>(rules, "password");

  return (
    <div className={pageStyles.page}>
      <Text className={pageStyles.header} block variant="xxLargePlus">Password Reset</Text>
      <form className={pageStyles.registerContainer} onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <div className={pageStyles.textContainer}>
          <Controller name="email" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Email" type="email" autoFocus required autoComplete="username" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} maxLength={256} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.passwordContainer}>
          <Controller name="password" rules={{ required: true, validate: passwordValidator }} render={({ field, fieldState }) => <TextField label="Password" type="password" required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.passwordContainer}>
          <Controller name="confirmPassword" rules={{ required: true, validate: confirmPasswordValidator }} render={({ field, fieldState }) => <TextField label="Confirm password" type="password" required autoComplete="new-password" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...field} value={field.value == null ? "" : field.value} errorMessage={fieldState.error?.type === "required" ? "Required." : fieldState.error?.message} />} />
        </div>
        <div className={pageStyles.registerBtnContainer}>
          <PrimaryButton type="submit" text="Reset password" disabled={!isDirty} />
        </div>
        <PasswordRules rules={rules} />
      </form>
    </div>
  );
}

function ResetPage() {
  const formMethods = useForm<PageFormType>({ defaultValues: { email: "", password: "", confirmPassword: "", token: "" }, mode: "onChange", reValidateMode: "onChange" });

  useTitleEffect("Password Reset");

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        <ResetPageInner />
      </FormProvider>
    </DirtyProvider>
  );
}

export default ResetPage;
