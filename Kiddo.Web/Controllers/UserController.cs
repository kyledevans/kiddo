namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Mvc;
using Kiddo.WebContract.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web.Resource;

[ApiController]
[Route("api/[controller]")]
[RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
[Security.EmailRequired]
public class UserController : ControllerBase
{
    private Models.UserModel UserModel { get; set; }

    public UserController(Models.UserModel userModel)
    {
        UserModel = userModel;
    }

    [HttpGet("SearchUsers")]
    [Authorize(Policy = nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator))]
    public async Task<ActionResult<SearchUsersResult>> SearchUsers()
    {
        SearchUsersResult retval = await UserModel.SearchUsers(1000).ConfigureAwait(false);
        return retval;
    }

    [HttpGet]
    [Authorize(Policy = nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator))]
    public async Task<ActionResult<User>> GetUser(Guid userId)
    {
        User user = await UserModel.GetUser(userId).ConfigureAwait(false);
        return user;
    }

    [HttpPut]
    [Authorize(Policy = nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator))]
    public async Task<ActionResult<User>> CreateUser(User newUser)
    {
        User user = await UserModel.CreateUser(newUser).ConfigureAwait(false);
        return user;
    }

    [HttpPost]
    [Authorize(Policy = nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator))]
    public async Task<ActionResult<User>> UpdateUser(User updateUser)
    {
        User user = await UserModel.UpdateUser(updateUser).ConfigureAwait(false);
        return user;
    }

    [HttpPost("DeleteUsers")]
    [Authorize(Policy = nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator))]
    public async Task<ActionResult> DeleteUsers(List<Guid> userIds)
    {
        // TODO: This needs to handle Foreign Key constraint exceptions.
        await UserModel.DeleteUsers(userIds).ConfigureAwait(false);
        return Ok();
    }
}
