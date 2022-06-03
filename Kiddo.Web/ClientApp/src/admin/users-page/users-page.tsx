import { FunctionComponent, useEffect, useState, useCallback, useMemo } from "react";
import { mergeStyleSets, Checkbox, IIconProps, IconButton, Dialog, PrimaryButton, DefaultButton, DialogFooter, IDialogContentProps, IModalProps, DialogType, IContextualMenuProps } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";

import { Api } from "../../api/api";
import { SearchUser } from "../../api/user";
import { withCheckableList, useCheckEntityControl, useCheckAllControl, useCheckableManager } from "../../common/checkable-list";
import { AppTheme } from "../../common/themes";
import { RouterCommandBarButton, RouterLink } from "../../common/router-link";
import { useSnackbar } from "../../common/snackbar";
import { useTitleEffect } from "../../common/title";
import { PolicyType, withRequiredPolicy } from "../../common/current-authorization";
import { Toolbar, ToolbarColumn3 } from "../../common/toolbar";
import { withRequiredEmailConfirmation } from "../../common/current-profile";

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "min-content 1fr",
    overflow: "hidden"
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
        padding: "8px 16px 8px 0"
      }
    }
  },
  btnNew: {
    paddingRight: 16
  },
  list: {
    display: "grid",
    gridTemplateRows: "min-content 1fr",
    overflowY: "hidden"
  },
  listScrollable: {
    overflowY: "scroll"
  },
  row: {
    display: "grid",
    gridTemplateColumns: "40px 24px 1fr",
    borderBottom: `1px solid ${AppTheme.palette.neutralLighter}`,
    height: 42,
    gridColumnGap: 16,
    backgroundColor: "#fff",
    selectors: {
      "&.dnd-placeholder": {
        opacity: 0
      }
    }
  },
  header: [
    AppTheme.fonts.medium,
    { color: AppTheme.palette.neutralDark },
    { borderBottomColor: AppTheme.palette.neutralLight },
    { fontWeight: 600 },
    { lineHeight: 42 },
    { cursor: "default" },
    { userSelect: "none" }
  ],
  cell: {
    display: "grid",
    alignItems: "center"
  },
  col1: {
    justifyContent: "center",
    paddingLeft: 16
  },
  col2: {

  },
  col3: {
    alignItems: "stretch",
    selectors: {
      ".ms-Link": {
        display: "grid",
        alignItems: "center"
      }
    }
  }
});

const icons: { menu: IIconProps, hamburger: IIconProps, add: IIconProps, delete: IIconProps } = {
  menu: { hidden: true },
  hamburger: { iconName: "MoreVertical" },
  add: { iconName: "Add" },
  delete: { iconName: "Delete" }
};

const UserItem: FunctionComponent<{ user: SearchUser, onDeleteClick: () => void }> = ({ user, onDeleteClick }) => {
  const [isChecked, { onEntityCheckChange: onUserCheckChange }] = useCheckEntityControl(user.userId);

  const menuProps: IContextualMenuProps = useMemo(() => {
    return {
      items: [
        {
          key: "delete",
          text: "Delete",
          iconProps: icons.delete,
          onClick: onDeleteClick
        }
      ],
      directionalHintFixed: true
    };
  }, [onDeleteClick]);

  const onHamburgerClick = useCallback(() => {
    onUserCheckChange(undefined, true);
  }, [onUserCheckChange]);

  return (
    <div className={pageStyles.row}>
      <div className={`${pageStyles.cell} ${pageStyles.col1}`}><Checkbox checked={isChecked} onChange={onUserCheckChange} /></div>
      <div className={`${pageStyles.cell} ${pageStyles.col2}`}><IconButton onMenuClick={onHamburgerClick} iconProps={icons.hamburger} menuProps={menuProps} menuIconProps={icons.menu} /></div>
      <div className={`${pageStyles.cell} ${pageStyles.col3}`}><RouterLink to={`/admin/users/edit/${user.userId}`}>{user.displayName}</RouterLink></div>
    </div>
  );
}

const UsersList: FunctionComponent<{ users: SearchUser[], onDeleteClick: () => void }> = ({ users, onDeleteClick }) => {
  const [isAllChecked, isAllIndeterminate, { onCheckAllChange, setEntityIds: setAccountIds }] = useCheckAllControl();

  useEffect(() => {
    setAccountIds(users.map(us => us.userId));
  }, [users, setAccountIds]);

  return (
    <div className={pageStyles.list}>
      <div className={`${pageStyles.row} ${pageStyles.header}`}>
        <div className={`${pageStyles.cell} ${pageStyles.col1}`}><Checkbox checked={isAllChecked} indeterminate={isAllIndeterminate} onChange={onCheckAllChange} /></div>
        <div className={`${pageStyles.cell} ${pageStyles.col2}`}></div>
        <div className={`${pageStyles.cell} ${pageStyles.col3}`}>User</div>
      </div>
      <div className={pageStyles.listScrollable}>
        {users.map(us => (<UserItem key={us.userId} user={us} onDeleteClick={onDeleteClick} />))}
      </div>
    </div>
  );
}

function AdminUsersPageInner() {
  const { checkedIds } = useCheckableManager<string>();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isDeleteDialogHidden, { setTrue: hideDeleteDialog, setFalse: showDeleteDialog }] = useBoolean(true);
  const snackbar = useSnackbar();

  useTitleEffect("Users");

  useEffect(() => {
    (async () => {
      const results = await Api.user.searchUsers();
      setUsers(results.users);
    })();
  }, [setUsers]);

  const onDeleteConfirm = useCallback(async () => {
    const userIds: string[] = [...checkedIds];

    let confirmMessage: string;
    if (userIds.length === 1) {
      let us = users.find(a => a.userId === userIds[0]);
      confirmMessage = us == null ? "" : `Deleted ${us.displayName}.`;
    } else {
      confirmMessage = `Deleted ${userIds.length} users.`;
    }

    await Api.user.deleteUsers(userIds);
    const results = await Api.user.searchUsers();
    setUsers(results.users);

    hideDeleteDialog();
    snackbar.open(confirmMessage);
  }, [checkedIds, users, setUsers, hideDeleteDialog, snackbar]);

  const dialogContentProps: IDialogContentProps = useMemo(() => {
    let dlgMessage: string;

    if (checkedIds.length === 1) {
      let us = users.find(us => us.userId === checkedIds[0]);
      dlgMessage = `Permanently delete ${us == null ? "" : us.displayName}?`;
    } else {
      dlgMessage = `Permanently delete ${checkedIds.length} accounts?`;
    }

    return {
      type: DialogType.normal,
      title: 'Confirm delete',
      showCloseButton: true,
      closeButtonAriaLabel: 'Cancel',
      subText: dlgMessage
    };
  }, [checkedIds, users]);

  const modalProps: IModalProps = useMemo(() => {
    return {
      isBlocking: true
    };
  }, []);

  return (
    <div className={pageStyles.page}>
      <Toolbar>
        <ToolbarColumn3><RouterCommandBarButton className={pageStyles.btnNew} to="/admin/users/edit/0" iconProps={icons.add}>New User</RouterCommandBarButton></ToolbarColumn3>
      </Toolbar>
      <UsersList users={users} onDeleteClick={showDeleteDialog} />
      <Dialog hidden={isDeleteDialogHidden} onDismiss={hideDeleteDialog} dialogContentProps={dialogContentProps} modalProps={modalProps}>
        <DialogFooter>
          <PrimaryButton onClick={onDeleteConfirm} text="Delete" />
          <DefaultButton onClick={hideDeleteDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </div>
  );
}

const CheckableAdminUsersPage = withCheckableList(AdminUsersPageInner);
let AdminUsersPage = withRequiredPolicy(CheckableAdminUsersPage, PolicyType.SuperAdministrator);
AdminUsersPage = withRequiredEmailConfirmation(AdminUsersPage);

export default AdminUsersPage;
