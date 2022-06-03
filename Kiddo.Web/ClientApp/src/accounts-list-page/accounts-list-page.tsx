import { useState, useEffect, useCallback, FunctionComponent, useMemo } from "react";
import { IIconProps, IContextualMenuProps, Checkbox, Dialog, IDialogContentProps, IModalProps, DialogType, DialogFooter, PrimaryButton, DefaultButton, mergeStyleSets, IconButton } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";

import { Api } from "../api/api";
import { Account } from "../api/account";
import { RouterLink, RouterCommandBarButton } from "../common/router-link";
import { useTitleEffect } from "../common/title";
import { useSnackbar } from "../common/snackbar";
import { withCheckableList, useCheckAllControl, useCheckEntityControl, useCheckableManager } from "../common/checkable-list";
import { AppTheme } from "../common/themes";
import { PolicyType, withRequiredPolicy } from "../common/current-authorization";
import { Toolbar, ToolbarColumn3 } from "../common/toolbar";
import { withRequiredEmailConfirmation } from "../common/current-profile";

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
    whiteSpace: "nowrap"
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

const iconProps: { menu: IIconProps, hamburger: IIconProps, add: IIconProps, delete: IIconProps } = {
  menu: { hidden: true },
  hamburger: { iconName: "MoreVertical" },
  add: { iconName: "Add" },
  delete: { iconName: "Delete" }
};

async function search(setAccounts: (newAccounts: Account[]) => void) {
  const newAccounts = await Api.account.searchAccounts();

  setAccounts(newAccounts);
}

const AccountItem: FunctionComponent<{ account: Account, onDeleteClick: () => void }> = ({ account, onDeleteClick }) => {
  const accountId = account.accountId;
  const [isChecked, { onEntityCheckChange: onAccountCheckChange }] = useCheckEntityControl(accountId);

  const menuProps: IContextualMenuProps = useMemo(() => {
    return {
      items: [
        {
          key: "delete",
          text: "Delete",
          iconProps: iconProps.delete,
          onClick: onDeleteClick
        }
      ],
      directionalHintFixed: true
    };
  }, [onDeleteClick]);

  const onHamburgerClick = useCallback(() => {
    onAccountCheckChange(undefined, true);
  }, [onAccountCheckChange]);

  return (
    <div className={pageStyles.row}>
      <div className={`${pageStyles.cell} ${pageStyles.col1}`}><Checkbox checked={isChecked} onChange={onAccountCheckChange} /></div>
      <div className={`${pageStyles.cell} ${pageStyles.col2}`}><IconButton onMenuClick={onHamburgerClick} iconProps={iconProps.hamburger} menuProps={menuProps} menuIconProps={iconProps.menu} /></div>
      <div className={`${pageStyles.cell} ${pageStyles.col3}`}><RouterLink to={`/manage/accounts/edit/${account.accountId}`}>{account.name}</RouterLink></div>
    </div>
  );
}

const AccountsList: FunctionComponent<{ accounts: Account[], onDeleteClick: () => void }> = ({ accounts, onDeleteClick }) => {
  const [isAllChecked, isAllIndeterminate, { onCheckAllChange, setEntityIds: setAccountIds }] = useCheckAllControl();

  useEffect(() => {
    setAccountIds(accounts.map(a => a.accountId));
  }, [accounts, setAccountIds]);

  return (
    <div className={pageStyles.list}>
      <div className={`${pageStyles.row} ${pageStyles.header}`}>
        <div className={`${pageStyles.cell} ${pageStyles.col1}`}><Checkbox checked={isAllChecked} indeterminate={isAllIndeterminate} onChange={onCheckAllChange} /></div>
        <div className={`${pageStyles.cell} ${pageStyles.col2}`}></div>
        <div className={`${pageStyles.cell} ${pageStyles.col3}`}>Account</div>
      </div>
      <div className={pageStyles.listScrollable}>
        {accounts.map(a => (<AccountItem key={a.accountId} account={a} onDeleteClick={onDeleteClick} />))}
      </div>
    </div>
  );
}

function AccountsListPageInner() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isDeleteDialogHidden, { setTrue: hideDeleteDialog, setFalse: showDeleteDialog }] = useBoolean(true);
  const { checkedIds } = useCheckableManager<number>();
  const snackbar = useSnackbar();

  useTitleEffect("Manage Accounts");

  useEffect(() => {
    search(setAccounts);
  }, [setAccounts]);

  const onDeleteConfirm = useCallback(async () => {
    const accountIds: number[] = [...checkedIds];

    let confirmMessage: string;
    if (accountIds.length === 1) {
      let acc = accounts.find(a => a.accountId === accountIds[0]);
      confirmMessage = acc == null ? "" : `Deleted ${acc.name}.`;
    } else {
      confirmMessage = `Deleted ${accountIds.length} accounts.`;
    }

    await Api.account.deleteAccounts(accountIds);
    await search(setAccounts);

    hideDeleteDialog();
    snackbar.open(confirmMessage);
  }, [checkedIds, accounts, setAccounts, hideDeleteDialog, snackbar]);

  const dialogContentProps: IDialogContentProps = useMemo(() => {
    let dlgMessage: string;

    if (checkedIds.length === 1) {
      let acc = accounts.find(a => a.accountId === checkedIds[0]);
      dlgMessage = `Permanently delete ${acc == null ? "" : acc.name}?`;
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
  }, [checkedIds, accounts]);

  const modalProps: IModalProps = useMemo(() => {
    return {
      isBlocking: true
    };
  }, []);

  return (
    <div className={pageStyles.page}>
      <Toolbar>
        <ToolbarColumn3><RouterCommandBarButton className={pageStyles.btnNew} to="/manage/accounts/edit/0" iconProps={iconProps.add}>New Account</RouterCommandBarButton></ToolbarColumn3>
      </Toolbar>
      <AccountsList accounts={accounts} onDeleteClick={showDeleteDialog} />
      <Dialog hidden={isDeleteDialogHidden} onDismiss={hideDeleteDialog} dialogContentProps={dialogContentProps} modalProps={modalProps}>
        <DialogFooter>
          <PrimaryButton onClick={onDeleteConfirm} text="Delete" />
          <DefaultButton onClick={hideDeleteDialog} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </div>
  );
}

const CheckableAccountsListPage = withCheckableList(AccountsListPageInner);
let AccountsListPage = withRequiredPolicy(CheckableAccountsListPage, PolicyType.Administrator);
AccountsListPage = withRequiredEmailConfirmation(AccountsListPage);

export default AccountsListPage;
