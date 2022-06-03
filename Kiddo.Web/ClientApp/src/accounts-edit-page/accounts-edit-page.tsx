import { useCallback, useState, useEffect, FormEvent, useRef, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import { IIconProps, Text, PrimaryButton, DefaultButton, TextField, Dialog, DialogFooter, mergeStyleSets, DialogType, IDialogContentProps, IModalProps, CommandBarButton } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler, useController } from "react-hook-form";

import { useTitleEffect } from "../common/title";
import { Api } from "../api/api";
import { Account } from "../api/account";
import { isNonEmptyString, parseIntStrict } from "../common/helper-functions";
import { DirtyProvider, useDirtyReactHookForm } from "../common/dirty";
import { useSnackbar } from "../common/snackbar";
import { ErrorCalloutControl, ErrorCallout } from "../common/error-callout";
import { useFormStateRefs, useAsyncLock } from "../common/hooks";
import { PolicyType, withRequiredPolicy } from "../common/current-authorization";
import { Toolbar, ToolbarBackButton, ToolbarColumn1, ToolbarColumn3 } from "../common/toolbar";
import { withRequiredEmailConfirmation } from "../common/current-profile";

interface PageFormType {
  name: string;
  nameShort: string;
  description: string;
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
    gridTemplateColumns: "min-content 1fr min-content",
    selectors: {
      ".toolbar-left": {

      },
      ".toolbar-middle": {

      },
      ".toolbar-right": {
        padding: "8px 16px 8px 0",
        whiteSpace: "nowrap"
      }
    }
  },
  btnDelete: {
    marginRight: 50
  },
  btnSave: {
    paddingRight: 16
  },
  editForm: {
    display: "grid",
    gridTemplateColumns: "300px 300px",
    gridAutoRows: "min-content",
    overflowY: "auto"
  },
  row: {
    display: "grid",
    gridRowEnd: "span 1",
    gridColumnEnd: "span 1",
    padding: 16
  },
  colspan2: {
    gridColumnEnd: "span 2"
  }
});

const icons: { save: IIconProps, delete: IIconProps } = {
  save: { iconName: "Save" },
  delete: { iconName: "Delete" }
};

async function initialize(accountId: number): Promise<{ account: Account }> {
  let account: Account;
  if (accountId === 0) {
    account = {
      accountId: 0,
      name: "",
      nameShort: "",
      description: null,
      currencies: []
    };
  } else {
    account = await Api.account.getAccount(accountId);
  }

  return { account };
}

function AccountsEditPageInner() {
  const { accountId: accountIdStr } = useParams<{ accountId?: string | undefined }>();
  const [isDeleteDialogHidden, { setTrue: hideDeleteDialog, setFalse: showDeleteDialog }] = useBoolean(true);
  const [account, setAccount] = useState<Account | null>(null);
  const history = useHistory();
  const isDirty = useDirtyReactHookForm();
  const accountId = parseIntStrict(accountIdStr, `Route parameter "accountId" must be an integer.`);
  const saveErrorDlg = useRef<ErrorCalloutControl | null>(null);
  const { handleSubmit, reset } = useFormContext<PageFormType>();
  const { field: nameShortField, fieldState: nameShortFieldState } = useController<PageFormType>({ name: "nameShort", rules: { required: true } }); // Need to customize the nameShort control because we force the user to create the string in all caps.
  const { isSubmitting, isValidating } = useFormStateRefs();
  const [ isDeleteLocked, setDeleteLock, setDeleteUnlock ] = useAsyncLock(false);
  useTitleEffect(accountId === 0 ? "New Account" : "Edit Account");

  const snackbar = useSnackbar();

  useEffect(() => {
    (async () => {
      if (account == null) {
        const { account: newAccount } = await initialize(accountId);
        setAccount(newAccount);
        reset({ name: newAccount.name, nameShort: newAccount.nameShort, description: newAccount.description ?? "" });
      }
    })();
  }, [accountId, account, setAccount, reset]);

  const onSubmitValid = useCallback<SubmitHandler<PageFormType>>(async ({ name, nameShort, description }) => {
    if (account == null) throw new Error("account cannot be null or undefined.");

    let saved: Account;

    if (account.accountId === 0) {
      saved = await Api.account.createAccount({ ...account, name: name.trim(), nameShort: nameShort.trim(), description: isNonEmptyString(description) ? description.trim() : null });
    } else {
      saved = await Api.account.updateAccount({ ...account, name: name.trim(), nameShort: nameShort.trim(), description: isNonEmptyString(description) ? description.trim() : null });
    }

    setAccount(saved);
    reset({ name: saved.name, nameShort: saved.nameShort, description: saved.description ?? "" });

    if (account.accountId === 0) {
      history.replace(`/manage/accounts/edit/${saved.accountId}`);
    }

    setTimeout(() => {
      history.push(`/manage/accounts`);
    }, 0);

    snackbar.open(account.accountId === 0 ? `Created ${saved.name}.` : `Updated ${saved.name}.`);
  }, [account, history, setAccount, reset, snackbar]);

  const onSubmitInvalid = useCallback<SubmitErrorHandler<PageFormType>>(() => {
    if (account == null) throw new Error("account cannot be null or undefined.");

    saveErrorDlg.current?.open(5000);
  }, [account]);

  const onDeleteConfirm = useCallback(async () => {
    if (account == null) throw new Error("account cannot be null or undefined.");

    if (isSubmitting.current || isDeleteLocked) return;

    try {
      setDeleteLock();
      await Api.account.deleteAccounts([account.accountId]);

      setTimeout(() => {
        history.push(`/manage/accounts`);
      }, 0);

      snackbar.open(`Deleted ${account.name}.`);
    } finally {
      setDeleteUnlock();
    }
  }, [account, history, snackbar, setDeleteLock, setDeleteUnlock, isSubmitting, isDeleteLocked]);

  const onSaveClick = useCallback(() => {
    // Don't try to save if there is currently a save or validation in progress.
    if (isSubmitting.current || isValidating.current || isDeleteLocked) {
      return;
    }

    handleSubmit<PageFormType>(
      (data, event) => onSubmitValid(data, event),
      (errors, event) => onSubmitInvalid(errors, event)
    )();
  }, [handleSubmit, onSubmitValid, onSubmitInvalid, isSubmitting, isValidating, isDeleteLocked]);

  const dialogContentProps: IDialogContentProps = useMemo(() => {
    return {
      type: DialogType.normal,
      title: 'Confirm delete',
      showCloseButton: true,
      closeButtonAriaLabel: 'Cancel',
      subText: `Permanently delete ${account?.name}?`
    };
  }, [account]);

  const modelProps: IModalProps = useMemo(() => {
    return {
      isBlocking: true
    };
  }, []);

  const onNameShortChange = useCallback((e: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.value = e.currentTarget.value.toLocaleUpperCase("en-US");
    nameShortField.onChange(e);
  }, [nameShortField]);

  return account == null ? (<div></div>) : (
    <div className={pageStyles.page}>
      <Toolbar>
        <ToolbarColumn1><ToolbarBackButton to="/manage/accounts">Back</ToolbarBackButton></ToolbarColumn1>
        <ToolbarColumn3>
          {accountId > 0 && (<CommandBarButton text="Delete" className={pageStyles.btnDelete} onClick={showDeleteDialog} iconProps={icons.delete} />)}
          <CommandBarButton id="btnSave" className={pageStyles.btnSave} text="Save" onClick={onSaveClick} iconProps={icons.save} disabled={!isDirty} /><ErrorCallout target="#btnSave" control={saveErrorDlg}><Text variant="small">Error: Unable to save.</Text></ErrorCallout>
        </ToolbarColumn3>
      </Toolbar>
      <form className={pageStyles.editForm} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
        <div className={`${pageStyles.row}`}>
          <Controller name="name" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Name" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        </div>
        <div className={`${pageStyles.row}`}>
          <TextField label="Name (short)" {...nameShortField} onChange={onNameShortChange} value={nameShortField.value == null ? "" : nameShortField.value} maxLength={4000} errorMessage={nameShortFieldState?.error?.type === "required" ? "Required." : ""} />
        </div>
        <div className={`${pageStyles.row} ${pageStyles.colspan2}`}>
          <Controller name="description" render={({ field, fieldState }) => <TextField label="Description" multiline autoAdjustHeight {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
        </div>
      </form>
      <Dialog hidden={isDeleteDialogHidden} onDismiss={hideDeleteDialog} dialogContentProps={dialogContentProps} modalProps={modelProps}>
        <DialogFooter>
          <PrimaryButton onClick={onDeleteConfirm} text="Delete" />
          <DefaultButton onClick={hideDeleteDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function AccountsEditPageDeps() {
  const formMethods = useForm<PageFormType>({
    defaultValues: { name: "", nameShort: "", description: "" }
  });

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        <AccountsEditPageInner />
      </FormProvider>
    </DirtyProvider>
  );
}

let AccountsEditPage = withRequiredPolicy(AccountsEditPageDeps, PolicyType.Administrator);
AccountsEditPage = withRequiredEmailConfirmation(AccountsEditPage);

export default AccountsEditPage;
