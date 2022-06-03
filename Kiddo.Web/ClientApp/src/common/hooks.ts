import { useRef, MutableRefObject, FormEventHandler, useCallback } from "react";
import { useBoolean } from "@fluentui/react-hooks";
import { useFormState, SubmitHandler, SubmitErrorHandler, useFormContext, FieldPath, Validate } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

import { PasswordValidationRules } from "../api/identity";
import { findUnique } from "./helper-functions";

/**
 * Helps enforce a pattern for locking things such as the UI during a save operation.
 * @param initialState Usually set to "false".
 */
export function useAsyncLock(initialState: boolean): AsyncLock {
  const [isLocked, callbacks] = useBoolean(initialState);

  const lock: AsyncLock = [
    isLocked, callbacks.setTrue, callbacks.setFalse
  ];

  return lock;
}

export type AsyncLock = [
  isLocked: boolean,
  lock: () => void,
  unlock: () => void
];

/** Integration helper with the react-hook-form library.  Provides reference access to the current form state for use in callbacks and event handlers. */
export function useFormStateRefs(): { isSubmitting: MutableRefObject<boolean>, isValidating: MutableRefObject<boolean> } {
  // Create references that are strongly typed to boolean.  We initialize to null, and then immediately throw an error if we are unable to retrieve the
  // current state of the form.  This will likely only happen when the caller forgot to setup the context created with <FormProvider />.
  const isSubmitting = useRef<boolean>((null as unknown) as boolean), isValidating = useRef<boolean>((null as unknown) as boolean);

  isSubmitting.current = useFormState().isSubmitting;
  isValidating.current = useFormState().isValidating;

  if (isSubmitting.current == null) throw new Error("Unable to retrieve the current isSubmitting state.  Is the caller invoking this from within a <FormProvider /> element?");
  if (isValidating.current == null) throw new Error("Unable to retrieve the current isValidating state.  Is the caller invoking this from within a <FormProvider /> element?");

  return {
    isSubmitting,
    isValidating
  };
}

export function useReactHookFormSubmitHandlers<T>(onSubmitValid: SubmitHandler<T>, onSubmitInvalid?: SubmitErrorHandler<T>): FormEventHandler {
  const { isSubmitting, isValidating } = useFormStateRefs();
  const { handleSubmit } = useFormContext<T>();

  const onLoginSubmitInvalidDefault: SubmitErrorHandler<T> = useCallback((errors, _ev) => { }, []);

  const onLoginSubmit: FormEventHandler = useCallback((event) => {
    event?.preventDefault();

    // Don't try to save if there is currently a save or validation in progress.
    if (isSubmitting.current || isValidating.current) {
      return;
    }

    handleSubmit<T>(
      (data, event) => onSubmitValid(data, event),
      (errors, event) => onSubmitInvalid == null ? onLoginSubmitInvalidDefault(errors, event) : onSubmitInvalid(errors, event)
    )();
  }, [isSubmitting, isValidating, handleSubmit, onSubmitValid, onSubmitInvalid, onLoginSubmitInvalidDefault]);

  return onLoginSubmit;
}

export type DebounceValidator<T> = (debouncePromise: Promise<T>, value: T, flushDebounce: () => void) => Promise<boolean | string>;

export function useDebouncedValidator<T>(validator: DebounceValidator<T>, wait?: number) {
  const validatorPromiseCtl = useRef<{ resolve: (value: T) => void, reject: (reason?: any) => void } | null>(null);

  const debouncePromise = useDebouncedCallback((value: T) => { validatorPromiseCtl.current?.resolve(value); }, wait == null ? 750 : wait);

  const debouncedValidator = useCallback(async (value: T) => {
    let validatorPromise = new Promise((waitingResolver: (value: T) => void, waitingRejector) => {
      validatorPromiseCtl.current?.reject("debounced");
      validatorPromiseCtl.current = null;
      validatorPromiseCtl.current = { resolve: waitingResolver, reject: waitingRejector };
      debouncePromise(value)
    }).then((value: T) => {
      // Debounce delay completed.
      return value;
    }, (reason: any) => {
      // Debounce was bounced.  Ignore this promise.
      throw reason;
    });

    try {
      return await validator(validatorPromise, value, debouncePromise.flush);
    } catch (ex) {
      if (ex !== "debounced") throw ex;
    }
  }, [validatorPromiseCtl, debouncePromise, validator]);

  return debouncedValidator;
}

export function usePasswordValidators<T>(rules: PasswordValidationRules | null, passwordFieldName: FieldPath<T>): { passwordValidator: Validate<string>, confirmPasswordValidator: Validate<string> } {
  const { getValues } = useFormContext<T>();

  const passwordValidator: Validate<string> = useCallback((value: string) => {
    if (rules == null) return true;

    const errorMessage = "Password too simple.";

    let passwordRegexStr = `^`;
    if (rules.requireLowercase) passwordRegexStr += "(?=.* [a - z])";
    if (rules.requireUppercase) passwordRegexStr += "(?=.*[A-Z])";
    if (rules.requireDigit) passwordRegexStr += "(?=.*\\d)";
    if (rules.requireNonAlphanumeric) passwordRegexStr += "(?=.*[^a-zA-Z\\d])";
    passwordRegexStr += `.{${rules.requiredLength},}$`;

    const passwordRegex = new RegExp(passwordRegexStr);

    if (!passwordRegex.test(value)) return errorMessage;

    if (rules.requiredUniqueChars > 0) {
      const unique = findUnique(value);
      if (rules.requiredUniqueChars > unique.length) return errorMessage;
    }

    return true;
  }, [rules]);

  const confirmPasswordValidator: Validate<string> = useCallback((value: string) => {
    if (getValues(passwordFieldName) !== value) return "Does not match.";
    return true;
  }, [getValues, passwordFieldName]);

  return { passwordValidator, confirmPasswordValidator };
}
