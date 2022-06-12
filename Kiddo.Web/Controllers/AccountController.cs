namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Mvc;
using Kiddo.WebContract.Account;
using Microsoft.Identity.Web.Resource;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Security.EmailRequired]
public class AccountController : ControllerBase
{
    private Models.AccountModel AccountModel { get; set; }

    public AccountController(Models.AccountModel accountModel)
    {
        AccountModel = accountModel;
    }

    [HttpGet]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.ReadOnlyUser))]
    public async Task<ActionResult<Account>> GetAccount(int accountId)
    {
        Account? account = await AccountModel.GetAccount(accountId).ConfigureAwait(false);

        if (account == null)
        {
            return StatusCode(StatusCodes.Status404NotFound);
        }

        return account;
    }

    [HttpGet("SearchAccounts")]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.ReadOnlyUser))]
    public async Task<ActionResult<List<SearchAccountResult>>> SearchAccounts()
    {
        List<SearchAccountResult> results = await AccountModel.SearchAccounts().ConfigureAwait(false);
        return results;
    }

    [HttpPut]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.Administrator))]
    public async Task<ActionResult<Account>> CreateAccount(Account newAccount)
    {
        Account result = await AccountModel.CreateAccount(newAccount).ConfigureAwait(false);
        return result;
    }

    [HttpPost]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.Administrator))]
    public async Task<ActionResult<Account>> UpdateAccount(Account update)
    {
        Account? result = await AccountModel.UpdateAccount(update).ConfigureAwait(false);

        if (result == null)
        {
            return StatusCode(StatusCodes.Status404NotFound);
        }

        return result;
    }

    [HttpPost("DeleteAccounts")]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.Administrator))]
    public async Task<ActionResult> DeleteAccounts(List<int> accountIds)
    {
        await AccountModel.DeleteAccounts(accountIds).ConfigureAwait(false);
        return Ok();
    }
}
