namespace Kiddo.Web.Models;

using AutoMapper;
using Kiddo.Web.Mappers;

public class AccountModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.AccountDAL AccountDB { get; set; }
    private DAL.EntryDAL EntryDB { get; set; }
    private IMapper Mapper { get; set; }

    public AccountModel(DAL.KiddoDAL db, DAL.AccountDAL accountDB, DAL.EntryDAL entryDB, IMapper mapper)
    {
        DB = db;
        AccountDB = accountDB;
        EntryDB = entryDB;
        Mapper = mapper;
    }

    public async Task<WebContract.Account.Account?> GetAccount(int accountId)
    {
        WebContract.Account.Account? retval;

        Database.Models.Account? dbAccount = await AccountDB.GetAccount(accountId).ConfigureAwait(false);
        if (dbAccount != null)
        {
            List<DAL.QueryModels.AccountCurrencySummary> dbCurrencies = await AccountDB.GetAccountCurrencySummaries(accountId).ConfigureAwait(false);
            retval = Mapper.DB_Account_Web_Account(dbAccount, dbCurrencies);
        }
        else
        {
            retval = null;
        }

        return retval;
    }

    public async Task<List<WebContract.Account.SearchAccountResult>> SearchAccounts()
    {
        List<Database.Models.Account> dbAccounts = await AccountDB.GetAllAccounts().ConfigureAwait(false);
        List<WebContract.Account.SearchAccountResult> retval = new();

        // Fetch the currency summaries for all accounts.
        // TODO: This is going to have horrible performance at scale.  Replace with a custom query once it becomes an issue.
        foreach (Database.Models.Account dbAccount in dbAccounts)
        {
            List<DAL.QueryModels.AccountCurrencySummary> dbCurrencies = await AccountDB.GetAccountCurrencySummaries(dbAccount.AccountId).ConfigureAwait(false);
            retval.Add(Mapper.DB_Account_Web_SearchAccountResult(dbAccount, dbCurrencies));
        }

        return retval;
    }

    public async Task<WebContract.Account.Account> CreateAccount(WebContract.Account.Account newAccount)
    {
        Database.Models.Account dbAccount = Mapper.Map<WebContract.Account.Account, Database.Models.Account>(newAccount);
        dbAccount.AccountId = 0;
        await AccountDB.InsertAccount(dbAccount).ConfigureAwait(false);
        WebContract.Account.Account retval = Mapper.Map<Database.Models.Account, WebContract.Account.Account>(dbAccount);
        return retval;
    }

    public async Task<WebContract.Account.Account?> UpdateAccount(WebContract.Account.Account update)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);
        WebContract.Account.Account? retval;

        Database.Models.Account? dbAccount = await AccountDB.GetAccount(update.AccountId).ConfigureAwait(false);

        if (dbAccount != null)
        {
            Mapper.Map(update, dbAccount);
            await DB.SaveChanges().ConfigureAwait(false);
            await trans.CommitAsync().ConfigureAwait(false);
            retval = Mapper.Map<Database.Models.Account, WebContract.Account.Account>(dbAccount);
        }
        else
        {
            retval = null;
        }

        return retval;
    }

    public async Task DeleteAccounts(List<int> accountIds)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        List<Database.Models.Entry> dbEntries = await EntryDB.GetEntriesByAccounts(accountIds).ConfigureAwait(false);
        List<Database.Models.Account> dbAccounts = await AccountDB.GetAccounts(accountIds).ConfigureAwait(false);
        await EntryDB.DeleteEntries(dbEntries).ConfigureAwait(false);
        await AccountDB.DeleteAccounts(dbAccounts).ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);
    }
}
