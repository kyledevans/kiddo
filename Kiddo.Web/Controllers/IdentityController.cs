namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
public class IdentityController : ControllerBase
{
    private Models.IdentityModel Model { get; set; }

    public IdentityController(Models.IdentityModel model)
    {
        Model = model;
    }

    [HttpPost("Register")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    public async Task<ActionResult<WebContract.Identity.RegisterResponse>> Register(WebContract.Identity.RegisterRequest registerRequest)
    {
        WebContract.Identity.RegisterResponse response = await Model.Register(registerRequest.Email, registerRequest.Password, registerRequest.DisplayName, registerRequest.GivenName, registerRequest.Surname).ConfigureAwait(false);
        return response;
    }

    [HttpPost("Authenticate")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    public async Task<ActionResult<WebContract.Identity.AuthenticateResponse>> Authenticate(WebContract.Identity.AuthenticateRequest authRequest)
    {
        WebContract.Identity.AuthenticateResponse response = await Model.Authenticate(authRequest.Username, authRequest.Password).ConfigureAwait(false);
        return response;
    }

    [HttpPost("GenerateNewJwts")]
    [Authorize(Policy = $"{Security.SecurityConstants.Policy.AspNetIdentityRefresh}")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    public async Task<ActionResult<WebContract.Identity.GenerateNewJwtsResponse>> GenerateNewJwts()
    {
        WebContract.Identity.GenerateNewJwtsResponse response = await Model.GenerateNewJwts().ConfigureAwait(false);
        return response;
    }

    [HttpGet("GetPasswordValidationRules")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    public ActionResult<WebContract.Identity.PasswordValidationRules> GetPasswordValidationRules()
    {
        WebContract.Identity.PasswordValidationRules response = Model.GetPasswordValidationRules();
        return response;
    }

    [HttpPost("SendPasswordReset")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    public async Task<ActionResult> SendPasswordReset(WebContract.Identity.SendPasswordResetRequest sendResetRequest)
    {
        await Model.SendPasswordReset(sendResetRequest.Email).ConfigureAwait(false);
        return Ok();
    }

    [HttpPost("PasswordReset")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    public async Task<ActionResult<WebContract.Identity.PasswordResetResponse>> PasswordReset(WebContract.Identity.PasswordResetRequest resetRequest)
    {
        WebContract.Identity.PasswordResetResponse response = await Model.PasswordReset(resetRequest.Email, resetRequest.Password, resetRequest.Token).ConfigureAwait(false);
        return response;
    }

    [HttpPost("ChangePassword")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    [Security.EmailRequired]
    public async Task<ActionResult> ChangePassword(WebContract.Identity.ChangePasswordRequest changeRequest)
    {
        bool response = await Model.ChangePassword(changeRequest.CurrentPassword, changeRequest.NewPassword).ConfigureAwait(false);
        if (response) return Ok();
        else return BadRequest();
    }

    [HttpPost("RemovePassword")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    [Security.EmailRequired]
    public async Task<ActionResult> RemovePassword()
    {
        bool response = await Model.RemovePassword().ConfigureAwait(false);
        if (response) return Ok();
        else return BadRequest();
    }

    [HttpPost("RemovePasswordByUserId")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    [Authorize(Policy = Security.SecurityConstants.Policy.SuperAdministrator)]
    [Security.EmailRequired]
    public async Task<ActionResult> RemovePasswordByUserId(Guid userId)
    {
        bool response = await Model.RemovePasswordByUserId(userId).ConfigureAwait(false);
        if (response) return Ok();
        else return BadRequest();
    }

    [HttpPost("SetPassword")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    [Security.EmailRequired]
    public async Task<ActionResult> SetPassword(WebContract.Identity.SetPasswordRequest setRequest)
    {
        bool response = await Model.SetPassword(setRequest.NewPassword).ConfigureAwait(false);
        if (response) return Ok();
        else return BadRequest();
    }

    [HttpPost("SetPasswordByUserId")]
    [Security.AuthenticationMethodEnabled(WebContract.AuthenticationMethodType.Password)]
    [Authorize(Policy = Security.SecurityConstants.Policy.SuperAdministrator)]
    [Security.EmailRequired]
    public async Task<ActionResult> SetPasswordByUserId(Guid userId, WebContract.Identity.SetPasswordRequest setRequest)
    {
        bool response = await Model.SetPasswordByUserId(userId, setRequest.NewPassword).ConfigureAwait(false);
        if (response) return Ok();
        else return BadRequest();
    }
}
