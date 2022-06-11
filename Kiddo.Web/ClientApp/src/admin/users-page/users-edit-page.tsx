import { FunctionComponent, useCallback, useState, useEffect, useRef, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import { mergeStyleSets, IIconProps, DefaultButton, PrimaryButton, Dialog, DialogFooter, IDialogContentProps, DialogType, IModalProps, TextField, Dropdown, IDropdownOption, CommandBarButton } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useForm, useFormContext, FormProvider, Controller, SubmitHandler, SubmitErrorHandler, useController } from "react-hook-form";

import { Api } from "../../api/api";
import { User } from "../../api/user";
import { SecurityRoleType, GuidEmpty } from "../../api/constants";
import { DirtyProvider, useDirtyReactHookForm } from "../../common/dirty";
import { isNonEmptyString } from "../../common/helper-functions";
import { useFormStateRefs, useAsyncLock, useReactHookFormSubmitHandlers } from "../../common/hooks";
import { useTitleEffect } from "../../common/title";
import { useSnackbar } from "../../common/snackbar";
import { ErrorCalloutControl } from "../../common/error-callout";
import { useCurrentProfileRequired, withRequiredEmailConfirmation, withRequiredProfile } from "../../common/current-profile";
import { PolicyType, withRequiredPolicy } from "../../common/current-authorization";
import { Toolbar, ToolbarBackButton, ToolbarColumn1, ToolbarColumn3 } from "../../common/toolbar";

interface PageFormType {
  givenName: string;
  surname: string;
  displayName: string;
  email: string;
  securityRole: SecurityRoleType;
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
  btnDelete: {
    marginRight: 50
  },
  btnSave: {
    paddingRight: 16
  },
  editForm: {
    
  },
  profileTab: {
    display: "grid",
    gridTemplateColumns: "300px",
    gridAutoRows: "min-content",
    overflowY: "auto",
    padding: 16,
    gridRowGap: 16
  },
  row: {
    display: "grid",
    gridRowEnd: "span 1",
    gridColumnEnd: "span 1"
  }
});

const icons: { save: IIconProps, delete: IIconProps } = {
  save: { iconName: "Save" },
  delete: { iconName: "Delete" }
};

const securityRoleOptions: IDropdownOption[] = [
  { key: SecurityRoleType.SuperAdministrator, text: "Super administrator" },
  { key: SecurityRoleType.Administrator, text: "Administrator" },
  { key: SecurityRoleType.User, text: "User" },
  { key: SecurityRoleType.ReadOnlyUser, text: "Read-only user" }
];

function useInitializationEffect(userId: string, setUser: (newUser: User) => void) {
  useEffect(() => {
    (async () => {
      let user: User;

      if (userId === GuidEmpty) {
        // New user
        user = {
          userId: GuidEmpty,
          securityRole: SecurityRoleType.ReadOnlyUser,
          externalId: null,
          givenName: null,
          surname: null,
          displayName: "",
          email: null,
          isActive: true,
          hasPassword: false
        };
      } else {
        // Fetch existing user
        user = await Api.user.getUser(userId);
      }

      setUser(user);
      //reset({ givenName: user.givenName ?? "", surname: user.surname ?? "", displayName: user.displayName, email: user.email ?? "", securityRole: user.securityRole });
    })();
  }, [userId, setUser]);
}

const SecurityRoleField: FunctionComponent<{ userId: string }> = ({ userId }) => {
  const { field: securityRoleField } = useController<PageFormType>({ name: "securityRole", rules: { required: true } }); // Need to customize the securityRole control because the Fluent UI component doesn't work very well with react-hook-form.
  const securityRoleOnChangeInner = securityRoleField.onChange;
  const securityRoleOnChange: (...event: any[]) => void = useCallback((_event, o: IDropdownOption) => securityRoleOnChangeInner(o.key), [securityRoleOnChangeInner]);
  const me = useCurrentProfileRequired();

  return (
    <>
      <Dropdown label="Role" disabled={userId === me.userId} required options={securityRoleOptions} onBlur={securityRoleField.onBlur} onChange={securityRoleOnChange} selectedKey={securityRoleField.value ? securityRoleField.value : undefined} />
    </>
  );
}

const DeleteButton: FunctionComponent<{ user: User | null, onDeleteConfirm: () => void }> = ({ user, onDeleteConfirm }) => {
  const me = useCurrentProfileRequired();
  const [isDeleteDialogHidden, { setTrue: hideDeleteDialog, setFalse: showDeleteDialog }] = useBoolean(true);

  const dialogContentProps: IDialogContentProps = useMemo(() => {
    return {
      type: DialogType.normal,
      title: 'Confirm delete',
      showCloseButton: true,
      closeButtonAriaLabel: 'Cancel',
      subText: `Permanently delete ${user?.displayName}?`
    };
  }, [user]);

  const modalProps: IModalProps = useMemo(() => {
    return {
      isBlocking: true
    };
  }, []);

  return (
    <>
      {(user != null && user.userId !== GuidEmpty && user.userId !== me.userId) && (<CommandBarButton tabIndex={-1} text="Delete" className={pageStyles.btnDelete} onClick={showDeleteDialog} iconProps={icons.delete} />)}
      <Dialog hidden={isDeleteDialogHidden} onDismiss={hideDeleteDialog} dialogContentProps={dialogContentProps} modalProps={modalProps}>
        <DialogFooter>
          <PrimaryButton onClick={onDeleteConfirm} text="Delete" />
          <DefaultButton onClick={hideDeleteDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </>
  );
}

const UsersEditPageInner: FunctionComponent<{ user: User, setUser: (newUser: User) => void }> = ({ user, setUser }) => {
  const { isSubmitting } = useFormStateRefs();
  const { reset } = useFormContext<PageFormType>();
  const [isDeleteLocked, setDeleteLock, setDeleteUnlock] = useAsyncLock(false);
  const snackbar = useSnackbar();
  const history = useHistory();
  const saveErrorDlg = useRef<ErrorCalloutControl | null>(null);
  const isDirty = useDirtyReactHookForm();

  useEffect(() => {
    reset({ givenName: user.givenName ?? "", surname: user.surname ?? "", displayName: user.displayName, email: user.email ?? "", securityRole: user.securityRole });
  }, [user, reset]);

  const onDeleteConfirm = useCallback(async () => {
    if (user == null) throw new Error("user cannot be null or undefined.");

    if (isSubmitting.current || isDeleteLocked) return;

    try {
      setDeleteLock();
      await Api.user.deleteUsers([user.userId]);

      setTimeout(() => {
        history.push(`/admin/users`);
      }, 0);

      snackbar.open(`Deleted ${user.displayName}.`);
    } finally {
      setDeleteUnlock();
    }
  }, [user, history, snackbar, setDeleteLock, setDeleteUnlock, isSubmitting, isDeleteLocked]);

  const onSubmitValid = useCallback<SubmitHandler<PageFormType>>(async ({ givenName, surname, displayName, email, securityRole }) => {
    if (user == null) throw new Error("user cannot be null or undefined.");

    let saved: User;

    if (user.userId === GuidEmpty) {
      saved = await Api.user.createUser({ ...user, givenName: isNonEmptyString(givenName) ? givenName.trim() : null, surname: isNonEmptyString(surname) ? surname.trim() : null, displayName: displayName.trim(), email: isNonEmptyString(email) ? email.trim() : null, securityRole: securityRole });
    } else {
      saved = await Api.user.updateUser({ ...user, givenName: isNonEmptyString(givenName) ? givenName.trim() : null, surname: isNonEmptyString(surname) ? surname.trim() : null, displayName: displayName.trim(), email: isNonEmptyString(email) ? email.trim() : null, securityRole: securityRole });
    }

    setUser(saved);
    reset({ givenName: saved.givenName ?? "", surname: saved.surname ?? "", displayName: saved.displayName, email: saved.email ?? "", securityRole: saved.securityRole });

    if (user.userId === GuidEmpty) {
      history.replace(`/admin/users/edit/${saved.userId}`);
    }

    setTimeout(() => {
      history.push(`/admin/users`);
    }, 0);

    snackbar.open(user.userId === GuidEmpty ? `Created ${saved.displayName}.` : `Updated ${saved.displayName}.`);
  }, [user, history, setUser, reset, snackbar]);

  const onSubmitInvalid = useCallback<SubmitErrorHandler<PageFormType>>(() => {
    if (user == null) throw new Error("user cannot be null or undefined.");

    saveErrorDlg.current?.open(5000);
  }, [user]);

  const onSubmit = useReactHookFormSubmitHandlers(onSubmitValid, onSubmitInvalid);

  return (
    <form className={pageStyles.page} onSubmit={onSubmit} noValidate autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck="false">
      <Toolbar>
        <ToolbarColumn1><ToolbarBackButton to="/admin/users">Back</ToolbarBackButton> </ToolbarColumn1>
        <ToolbarColumn3><DeleteButton user={user} onDeleteConfirm={onDeleteConfirm} /><CommandBarButton type="submit" iconProps={icons.save} className={pageStyles.btnSave} disabled={!isDirty}>Save</CommandBarButton></ToolbarColumn3>
      </Toolbar>
      <div className={pageStyles.editForm}>
        <div className={pageStyles.profileTab}>
          <div className={`${pageStyles.row}`}>
            <Controller name="displayName" rules={{ required: true }} render={({ field, fieldState }) => <TextField label="Display name" required autoComplete="edit-user-displayName" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
          </div>
          <div className={`${pageStyles.row}`}>
            <Controller name="givenName" render={({ field, fieldState }) => <TextField label="First name" autoComplete="edit-user-givenName" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
          </div>
          <div className={`${pageStyles.row}`}>
            <Controller name="surname" render={({ field, fieldState }) => <TextField label="Last name" autoComplete="edit-user-surname" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
          </div>
          <div className={`${pageStyles.row}`}>
            <Controller name="email" render={({ field, fieldState }) => <TextField label="Email" type="email" autoComplete="edit-user-email" {...field} value={field.value == null ? "" : field.value} maxLength={4000} errorMessage={fieldState?.error?.type === "required" ? "Required." : ""} />} />
          </div>
          <div className={`${pageStyles.row}`}>
            <SecurityRoleField userId={user.userId} />
          </div>
        </div>
      </div>
    </form>
  );
}

const UsersEditPageDeps: FunctionComponent<{}> = () => {
  const { userId: userIdStr } = useParams<{ userId?: string | undefined }>();
  const userId = userIdStr == null ? GuidEmpty : userIdStr;

  const formMethods = useForm<PageFormType>({
    defaultValues: { givenName: "", surname: "", displayName: "", email: "", securityRole: SecurityRoleType.ReadOnlyUser }
  });
  const [user, setUser] = useState<User | null>(null);

  useTitleEffect(userId === GuidEmpty ? "New User" : "Edit Profile");
  useInitializationEffect(userId, setUser);

  return (
    <DirtyProvider>
      <FormProvider {...formMethods}>
        {(user != null) && (<UsersEditPageInner user={user} setUser={setUser} />)}
      </FormProvider>
    </DirtyProvider>
  );
}

let UsersEditPage = UsersEditPageDeps;
UsersEditPage = withRequiredProfile(UsersEditPage);
UsersEditPage = withRequiredPolicy(UsersEditPage, PolicyType.SuperAdministrator);
UsersEditPage = withRequiredEmailConfirmation(UsersEditPage);

export default UsersEditPage;
