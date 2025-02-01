import { useState, useCallback, useEffect, FunctionComponent } from "react";
import { useParams } from "react-router-dom";
import { Text, IconButton, IButtonStyles, IIconProps, mergeStyleSets } from "@fluentui/react";

import { useTitle } from "../common/title";
import { Api } from "../api/api";
import { Lookup, LookupTypeType } from '../api/lookup-type';
import { Account } from "../api/account";
import { GuidEmpty } from "../api/constants";
import { parseIntStrict } from "../common/helper-functions";
import { AppTheme } from "../common/themes";
import { PolicyType, useCurrentPolicies, withRequiredPolicy } from "../common/current-authorization";
import { Toolbar, ToolbarColumn1, ToolbarBackButton } from "../common/toolbar";
import { withRequiredEmailConfirmation } from "../common/current-profile";

const icons: { add: IIconProps, subtract: IIconProps } = {
  add: { iconName: "Add" },
  subtract: { iconName: "CalculatorSubtract" }
};

const iconButtonStyles: IButtonStyles = {
  root: {
    width: 64,
    alignSelf: "stretch",
    height: "auto"
  },
  rootDisabled: {
    backgroundColor: "transparent"
  },
  icon: {
    fontSize: 40
  }
};

const pageStyles = mergeStyleSets({
  page: {

  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    rowGap: 16,
    padding: 16
  },
  tokenCard: {
    border: "1px solid rgb(237, 235, 233)",
    height: 100,
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    userSelect: "none"
  },
  cardTitleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid rgb(237, 235, 233)",
    backgroundColor: AppTheme.palette.neutralLighterAlt
  },
  cardControlContainer: {
    display: "flex",
    alignItems: "center",
    marginLeft: 100
  },
  cardCount: {
    width: 120,
    textAlign: "center",
    paddingBottom: 8
  }
});

interface PageAssets {
  allCurrencies: Lookup[];
}

async function initialize(accountId: number, setAccount: (newAccount: Account) => void, setAssets: (newAssets: PageAssets) => void): Promise<void> {
  const [currencies, account] = await Promise.all([Api.lookupType.getLookupType(LookupTypeType.Currency), Api.account.getAccount(accountId)]);

  const newAssets: PageAssets = {
    allCurrencies: currencies.lookups
  };

  setAccount(account);
  setAssets(newAssets);
}

const EntryItem: FunctionComponent<{ account: Account, currency: Lookup }> = ({ account, currency }) => {
  const summary = account.currencies.find(acs => acs.currencyLookupId === currency.lookupId);

  if (summary == null) throw new Error(`Could not find account currency summary for currencyLookupId: ${currency.lookupId}.`);

  const [totalValue, setTotalValue] = useState<number>(summary.totalValue);
  const [policies] = useCurrentPolicies();

  const addClick = useCallback(async () => {
    setTotalValue(prev => prev + 1);
    await Api.entry.createEntry({ entryId: 0, accountId: account.accountId, currencyLookupId: currency.lookupId, dateAddedUtc: (new Date()).toISOString(), userId: GuidEmpty, value: 1 });
  }, [currency, account, setTotalValue]);

  const subtractClick = useCallback(async () => {
    setTotalValue(prev => prev - 1);
    await Api.entry.createEntry({ entryId: 0, accountId: account.accountId, currencyLookupId: currency.lookupId, dateAddedUtc: (new Date()).toISOString(), userId: GuidEmpty, value: -1 });
  }, [currency, account, setTotalValue]);

  if (policies == null) throw new Error("policies cannot be null or undefined.");

  return (
    <div className={pageStyles.tokenCard}>
      <div className={pageStyles.cardTitleContainer}><Text block variant="large">{currency.name}</Text></div>
      <div className={pageStyles.cardControlContainer}>
        <IconButton iconProps={icons.subtract} styles={iconButtonStyles} onClick={subtractClick} disabled={(totalValue != null && totalValue <= 0) || !policies.isUser}></IconButton>
        <Text block className={pageStyles.cardCount} variant="mega">{totalValue}</Text>
        <IconButton iconProps={icons.add} styles={iconButtonStyles} onClick={addClick} disabled={(totalValue != null && totalValue >= 100) || !policies.isUser}></IconButton>
      </div>
    </div>
  );
}

function AccountsEntriesPageInner() {
  const { accountId: accountIdStr } = useParams<{ accountId?: string | undefined }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [assets, setAssets] = useState<PageAssets>({ allCurrencies: [] });
  const [,setAppTitle] = useTitle();

  const accountId = parseIntStrict(accountIdStr, "Route parameter \"accountId\" must be an integer.");

  useEffect(() => {
    initialize(accountId, setAccount, setAssets);
  }, [accountId, setAccount, setAssets]);

  useEffect(() => {
    setAppTitle(`${account == null ? "" : (account.name + " Entries")}`);
  }, [account, setAppTitle]);

  if (account == null) {
    return (
      <div>Retrieving account...</div>
    );
  } else {
    return (
      <div className={pageStyles.page}>
        <Toolbar>
          <ToolbarColumn1><ToolbarBackButton to="/accounts">Back</ToolbarBackButton></ToolbarColumn1>
        </Toolbar>
        <div className={pageStyles.listContainer}>
          {assets.allCurrencies.map(c => (
            <EntryItem key={c.lookupId} account={account} currency={c} />
          ))}
        </div>
      </div>
    );
  }
}

let AccountsEntriesPage = withRequiredPolicy(AccountsEntriesPageInner, PolicyType.User);
AccountsEntriesPage = withRequiredEmailConfirmation(AccountsEntriesPage);
export default AccountsEntriesPage;
