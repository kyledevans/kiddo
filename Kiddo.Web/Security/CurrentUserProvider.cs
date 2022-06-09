namespace Kiddo.Web.Security;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

public class CurrentUserProvider : ICurrentUserProvider
{
    private IHttpContextAccessor ContextAccessor { get; set; }
    private IAuthorizationService AuthorizationService { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private bool IsInitialized { get; set; }
    private string? CachedAzureIdentifier { get; set; }
    private Guid? CachedAspNetIdentifier { get; set; }
    private Guid? UserId { get; set; }
    private UserManager<Database.Models.User> UserManager { get; set; }

    public CurrentUserProvider(IHttpContextAccessor contextAccessor, IAuthorizationService authorizationService, DAL.UserDAL userDB, UserManager<Database.Models.User> userManager)
    {
        ContextAccessor = contextAccessor;
        AuthorizationService = authorizationService;
        UserDB = userDB;
        UserManager = userManager;
    }

    public async Task Initialize(bool forceRefresh = false)
    {
        if (IsInitialized && !forceRefresh) return;

        if (forceRefresh)
        {
            IsInitialized = false;
            CachedAzureIdentifier = null;
            CachedAspNetIdentifier = null;
            UserId = null;
        }

        if (ContextAccessor.HttpContext == null) throw new NullReferenceException($"Cannot determine the current user because the IHttpContextAccessor.HttpContext is null.");

        if (ContextAccessor.HttpContext.User.Identity == null) throw new NullReferenceException($"Cannot determine the current user because the IHttpContextAccessor.HttpContext.User.Identity is null.");

        if (ContextAccessor.HttpContext.User.Identity.IsAuthenticated)
        {
            if ((await AuthorizationService.AuthorizeAsync(ContextAccessor.HttpContext.User, SecurityConstants.Policy.AzureAd).ConfigureAwait(false)).Succeeded)
            {
                Claim? userIdClaim = ContextAccessor.HttpContext.User.Claims.FirstOrDefault(c => c.Type == Microsoft.Identity.Web.ClaimConstants.ObjectId);
                if (userIdClaim == null) throw new Exception($"Cannot determine the current user because the claim \"{Microsoft.Identity.Web.ClaimConstants.ObjectId}\" could not be found.");
                Database.Models.User? dbUser = await UserManager.FindByLoginAsync(SecurityConstants.Scheme.AzureAd, userIdClaim.Value).ConfigureAwait(false);

                CachedAzureIdentifier = userIdClaim.Value;
                UserId = dbUser?.Id;
            }
            else if ((await AuthorizationService.AuthorizeAsync(ContextAccessor.HttpContext.User, SecurityConstants.Policy.AspNetIdentity).ConfigureAwait(false)).Succeeded)
            {
                Claim? subjectClaim = ContextAccessor.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (subjectClaim != null)
                {
                    Guid userId = Guid.Parse(subjectClaim.Value);
                    CachedAspNetIdentifier = userId;
                    UserId = userId;
                }
            }
        }

        IsInitialized = true;
    }

    public async Task<string?> GetAzureAdIdentifier()
    {
        await Initialize().ConfigureAwait(false);

        return CachedAzureIdentifier;
    }

    public async Task<Guid?> GetAspNetIdentifier()
    {
        await Initialize().ConfigureAwait(false);

        return CachedAspNetIdentifier;
    }

    public async Task<Guid> GetUserIdRequired()
    {
        await Initialize().ConfigureAwait(false);

        if (UserId == null) throw new NullReferenceException("UserId cannot be null.");

        return (Guid)UserId;
    }

    public async Task<Guid?> GetUserId()
    {
        await Initialize().ConfigureAwait(false);

        return UserId;
    }
}
