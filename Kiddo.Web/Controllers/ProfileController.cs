namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;

[ApiController]
[Route("api/[controller]")]
[RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
public class ProfileController : ControllerBase
{
    private Models.ProfileModel ProfileModel { get; set; }

    public ProfileController(Models.ProfileModel profileModel)
    {
        ProfileModel = profileModel;
    }

    [HttpGet]
    public async Task<ActionResult<WebContract.Profile.Profile>> GetProfile()
    {
        WebContract.Profile.Profile? retval = await ProfileModel.GetProfile().ConfigureAwait(false);
        if (retval != null) return retval;
        else return Problem(null, null, StatusCodes.Status404NotFound, null, WebContract.ProblemDetailTypes.UserNotRegistered);
    }

    [HttpPost]
    [Authorize(Policy = nameof(Kiddo.Constants.SecurityRoleType.ReadOnlyUser))]
    public async Task<ActionResult<WebContract.Profile.Profile>> UpdateProfile(WebContract.Profile.Profile update)
    {
        WebContract.Profile.Profile retval = await ProfileModel.UpdateProfile(update).ConfigureAwait(false);
        return retval;
    }

    [HttpGet("GetAuthorizationPolicies")]
    public async Task<ActionResult<WebContract.Profile.PolicySummary>> GetAuthorizationPolicies()
    {
        WebContract.Profile.PolicySummary retval = await ProfileModel.GetAuthorizationPolicies().ConfigureAwait(false);
        return retval;
    }

    [HttpPost("SendConfirmationEmail")]
    public async Task<ActionResult> SendConfirmationEmail(WebContract.Profile.SendConfirmationEmailRequest sendConfirmRequest)
    {
        await ProfileModel.SendConfirmationEmail(sendConfirmRequest.Email).ConfigureAwait(false);
        return Ok();
    }

    [HttpPost("ConfirmEmail")]
    public async Task<ActionResult<WebContract.Profile.ConfirmEmailResponse>> ConfirmEmail(WebContract.Profile.ConfirmEmailRequest confirmRequest)
    {
        WebContract.Profile.ConfirmEmailResponse response = await ProfileModel.ConfirmEmail(confirmRequest.Email, confirmRequest.Token).ConfigureAwait(false);
        return response;
    }

    [HttpPost("ValidateEmailForRegistration")]
    public async Task<ActionResult<WebContract.ValidationResponse>> ValidateEmailForRegistration(string email)
    {
        WebContract.ValidationResponse response = await ProfileModel.ValidateEmailForRegistration(email).ConfigureAwait(false);
        return response;
    }
}
