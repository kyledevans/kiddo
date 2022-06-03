namespace Kiddo.DAL;

using Kiddo.Database.Models;
using Kiddo.DAL.QueryModels;

public class AccountDAL
{
    private KiddoDbContextExtended DbContext { get; set; }

    public AccountDAL(KiddoDbContextExtended dbContext)
    {
        this.DbContext = dbContext;
    }

    public async Task<Account?> GetAccount(int accountId)
    {
        return await (
            from a in DbContext.Accounts
            where a.AccountId == accountId
            select a).FirstOrDefaultAsync().ConfigureAwait(false);
    }

    public async Task<List<Account>> GetAccounts(List<int> accountIds)
    {
        return await (
            from a in DbContext.Accounts
            where accountIds.Contains(a.AccountId)
            orderby a.Name, a.AccountId
            select a).ToListAsync().ConfigureAwait(false);
    }

    public async Task<List<Account>> GetAllAccounts()
    {
        return await (
            from a in DbContext.Accounts
            orderby a.Name, a.AccountId
            select a).ToListAsync().ConfigureAwait(false);
    }

    public async Task<List<AccountCurrencySummary>> GetAccountCurrencySummaries(int accountId)
    {
        List<AccountCurrencySummary> summaries = await (
            from acs in DbContext.AccountCurrencySummaries.FromSqlInterpolated($@"
SELECT l.LookupId AS CurrencyLookupId, ISNULL(SUM(e.[Value]), 0) AS TotalValue
FROM [Account] AS a
	INNER JOIN [Lookup] AS l ON l.LookupTypeId = {(int)Constants.LookupTypeType.Currency}
	LEFT JOIN [Entry] AS e ON a.AccountId = e.AccountId
        AND l.LookupId = e.CurrencyLookupId
WHERE a.AccountId = {accountId}
GROUP BY l.LookupId, l.SortOrder
ORDER BY l.SortOrder, l.LookupId")
            select acs).ToListAsync().ConfigureAwait(false);

        return summaries;
    }

    public async Task InsertAccount(Account newAccount)
    {
        await DbContext.Accounts.AddAsync(newAccount).ConfigureAwait(false);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task DeleteAccounts(List<Account> accounts)
    {
        DbContext.Accounts.RemoveRange(accounts);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }
}
