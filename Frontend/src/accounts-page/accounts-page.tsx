import { useState, useEffect, FunctionComponent } from "react";
import { Text, mergeStyleSets } from "@fluentui/react";
import { Link as RouterLink } from "react-router-dom";

import { useTitleEffect } from "../common/title";
import { Api } from "../api/api";
import { Lookup, LookupTypeType } from "../api/lookup-type";
import { SearchAccountResult, AccountCurrencySummary } from "../api/account";
import { AppTheme } from "../common/themes";
import { PolicyType, useCurrentPolicies, withRequiredPolicy } from "../common/current-authorization";
import { withRequiredEmailConfirmation } from "../common/current-profile";

interface PageAssets {
  allCurrencies: Lookup[];
}

const pageStyles = mergeStyleSets({
  page: {
    display: "grid",
    overflow: "hidden"
  },
  listContainer: {
    display: "flex",
    padding: "8px 8px 16px 8px",
    flexWrap: "wrap",
    overflowY: "scroll"
  },
  accountCard: {
    position: "relative",
    margin: 8,
    display: "grid",
    gridTemplateColumns: "100%",
    gridTemplateRows: "150px 38px 1fr",
    width: 320,
    height: 238,
    border: `1px solid ${AppTheme.palette.neutralLight}`,
    textDecoration: "none",
    userSelect: "none",
    selectors: {
      "&:hover": {
        borderColor: "rgb(200, 198, 196)"
      },
      "&:hover::after": {
        content: `" "`,
        position: "absolute",
        boxSizing: "border-box",
        inset: 0,
        border: "1px solid rgb(200, 198, 196)",
        pointerEvents: "none"
      }
    }
  },
  cardImage: {
    display: "grid",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${AppTheme.palette.neutralLighterAlt}`,
    borderBottom: `1px solid ${AppTheme.palette.neutralLight}`
  },
  cardTitle: {
    padding: "8px 16px"
  },
  cardSummary: {
    padding: "8px 16px",
    display: "grid",
    gridTemplateColumns: "96px 96px 96px"
  },
  cardCurrency: {
    display: "grid",
    gridTemplateColumns: "min-content 1fr",
    alignItems: "center"
  },
  cardTokenIcon: {
    borderRadius: "50%",
    backgroundColor: "#813a7c", // rgb(164, 38, 44)
    width: 32,
    height: 32,
    display: "grid",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  cardTokenIconText: {
    color: "#fff",
    fontWeight: 600
  },
  cardTokenTotal: {
    fontWeight: 600,
    paddingLeft: 8
  }
});

async function searchAccounts(setAccounts: (newAccounts: SearchAccountResult[]) => void) {
  const allAccounts = await Api.account.searchAccounts();
  setAccounts(allAccounts);
}

async function initialize(setAccounts: (newAccounts: SearchAccountResult[]) => void, setAssets: (newAssets: PageAssets) => void): Promise<void> {
  const [currencies, accounts] = await Promise.all([Api.lookupType.getLookupType(LookupTypeType.Currency), Api.account.searchAccounts()]);

  const newAssets: PageAssets = {
    allCurrencies: currencies.lookups
  };

  setAccounts(accounts);
  setAssets(newAssets);
}

const CurrencySummary: FunctionComponent<{ summary: AccountCurrencySummary, allCurrencies: Lookup[] }> = ({ summary, allCurrencies }) => {
  const currency = allCurrencies.find(c => c.lookupId === summary.currencyLookupId);
  //if (currency == null) throw new Error("currency cannot be null or undefined.");

  if (summary.totalValue == null || currency == null) {
    return (<></>);
  } else {
    return (
      <div className={pageStyles.cardCurrency}>
        <div className={pageStyles.cardTokenIcon}><Text variant="medium" className={pageStyles.cardTokenIconText}>{currency.nameShort}</Text></div>
        <Text className={pageStyles.cardTokenTotal} block={true} variant="small">{summary.totalValue}</Text>
      </div>
    );
  }
}

const AccountCard: FunctionComponent<{ account: SearchAccountResult, allCurrencies: Lookup[] }> = ({ account, allCurrencies }) => {
  const [policies] = useCurrentPolicies();

  if (policies == null) throw new Error("policies cannot be null or undefined.");

  let content = (
    <>
      <div className={pageStyles.cardImage}><Text variant="mega">{account.nameShort}</Text></div>
      <div className={pageStyles.cardTitle}><Text variant="large">{account.name}</Text></div>
      <div className={pageStyles.cardSummary}>
        {account.currencies.filter((_s, index) => index < 3).map(s => (<CurrencySummary key={s.currencyLookupId} summary={s} allCurrencies={allCurrencies} />))}
      </div>
    </>
  );

  if (policies.isUser) {
    content = (<RouterLink className={pageStyles.accountCard} to={`/accounts/${account.accountId}/entries`}>{content}</RouterLink>);
  } else {
    content = (<div className={pageStyles.accountCard}>{content}</div>);
  }

  return content;
}

function AccountsPageInner() {
  const [accounts, setAccounts] = useState<SearchAccountResult[]>([]);
  const [assets, setAssets] = useState<PageAssets>({ allCurrencies: [] });

  useTitleEffect("Accounts");

  useEffect(() => {
    const interval = setInterval(() => {
      searchAccounts(setAccounts);
    }, 10000);

    return () => clearInterval(interval);
  }, [setAccounts]);

  useEffect(() => {
    let isSubscribed = true;

    (async () => {
      await initialize(setAccounts, setAssets);

      if (!isSubscribed) return;
    })();

    return () => { isSubscribed = false; };
  }, [setAccounts, setAssets]);

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.listContainer}>
        {accounts.map(a => <AccountCard key={a.accountId} account={a} allCurrencies={assets.allCurrencies} />)}
      </div>
    </div>
  );
}

let AccountsPage = withRequiredPolicy(AccountsPageInner, PolicyType.ReadOnlyUser);
AccountsPage = withRequiredEmailConfirmation(AccountsPage);

export default AccountsPage;
