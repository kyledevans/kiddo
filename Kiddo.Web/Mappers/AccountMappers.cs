namespace Kiddo.Web.Mappers;

using AutoMapper;

public static class AccountMappers
{
    public static WebContract.Account.Account DB_Account_Web_Account(this IMapper mapper, Database.Models.Account dbAccount, List<DAL.QueryModels.AccountCurrencySummary> dbCurrencySummaries)
    {
        WebContract.Account.Account retval = mapper.Map<Database.Models.Account, WebContract.Account.Account>(dbAccount);
        retval.Currencies = mapper.Map<List<DAL.QueryModels.AccountCurrencySummary>, List<WebContract.Account.AccountCurrencySummary>>(dbCurrencySummaries);
        return retval;
    }

    public static WebContract.Account.SearchAccountResult DB_Account_Web_SearchAccountResult(this IMapper mapper, Database.Models.Account dbAccount, List<DAL.QueryModels.AccountCurrencySummary> dbCurrencySummaries)
    {
        WebContract.Account.SearchAccountResult retval = mapper.Map<Database.Models.Account, WebContract.Account.SearchAccountResult>(dbAccount);
        retval.Currencies = mapper.Map<List<DAL.QueryModels.AccountCurrencySummary>, List<WebContract.Account.AccountCurrencySummary>>(dbCurrencySummaries);
        return retval;
    }
}
