namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kiddo.WebContract.AzureAd;

[ApiController]
[Route("api/[controller]")]
public class AzureAdController : ControllerBase
{
    private Models.AzureAdModel AzureAdModel { get; set; }

    public AzureAdController(Models.AzureAdModel azureAdModel)
    {
        AzureAdModel = azureAdModel;
    }

    // This endpoint needs to only allow Azure AD bearer tokens.  However we can't place any requirements on what roles are assigned to the user.  Obviously
    // since this is a "register" endpoint, it usually won't be possible for the user to even be assigned a role within the application yet.
    [Authorize(Policy = Security.SecurityConstants.Policy.AzureAd)]
    [HttpPost("Register")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.AzureAd)]
    public async Task<ActionResult<RegisterResponse>> Register()
    {
        RegisterResponse response = await AzureAdModel.Register(null, null).ConfigureAwait(false);
        return response;
    }

    /* This endpoint needs to only allow Azure AD bearer tokens.  However we can't place any requirements on what roles are assigned to the user.  Obviously
     * since this is a "register" endpoint, it usually won't be possible for the user to even be assigned a role within the application yet.
     * 
     * This endpoint needs to cover 2 different scenarios:
     *      1) Brand new user registering with Azure Ad.  These users will not exist in the application database, and therefore we cannot enforce any kind of role assignments.
     *      2) Existing users that use an alternate authentication method and want to link their Azure AD identity to their application user account.
     * 
     * Since this isn't something ASP.Net Core can currently accomplish with the builtin Authorize attribute, this ends up getting enforced in the business layer.
     */
    [Authorize(Policy = Security.SecurityConstants.Policy.AzureAd)]
    [HttpPost("RegisterManual")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.AzureAd)]
    public async Task<ActionResult<RegisterResponse>> RegisterManual(RegisterRequest request)
    {
        RegisterResponse response = await AzureAdModel.Register(request, null).ConfigureAwait(false);
        return response;
    }

    /// <summary>
    /// This is for users to link their existing application account that uses an auth method other than Azure AD.
    /// </summary>
    /// <param name="linkRequest"></param>
    /// <returns></returns>
    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    [HttpPost("LinkToExisting")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.AzureAd)]
    [Security.EmailRequired]
    public async Task<ActionResult<RegisterResponse>> LinkToExisting(LinkToExistingRequest linkRequest)
    {
        RegisterResponse response = await AzureAdModel.Register(null, linkRequest.AccessToken).ConfigureAwait(false);
        return response;
    }

    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    [HttpPost("RemoveLink")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.AzureAd)]
    [Security.EmailRequired]
    public async Task<ActionResult> RemoveLink(RemoveLinkRequest removeRequest)
    {
        await AzureAdModel.RemoveLink(removeRequest.ProviderKey).ConfigureAwait(false);
        return Ok();
    }

    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    [HttpGet("GetAccountLinks")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.AzureAd)]
    public async Task<ActionResult<List<AccountLink>>> GetAccountLinks()
    {
        List<AccountLink> response = await AzureAdModel.GetAccountLinks().ConfigureAwait(false);
        return response;
    }

    [Authorize(Policy = Security.SecurityConstants.Policy.SuperAdministrator)]
    [HttpGet("GetAccountLinksByUserId")]
    public async Task<ActionResult<List<AccountLink>>> GetAccountLinksByUserId(Guid userId)
    {
        List<AccountLink> response = await AzureAdModel.GetAccountLinksByUserId(userId).ConfigureAwait(false);
        return response;
    }
}
