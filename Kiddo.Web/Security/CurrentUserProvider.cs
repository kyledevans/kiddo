namespace Kiddo.Web.Security;

using Microsoft.AspNetCore.Authorization;
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

    public CurrentUserProvider(IHttpContextAccessor contextAccessor, IAuthorizationService authorizationService, DAL.UserDAL userDB)
    {
        ContextAccessor = contextAccessor;
        AuthorizationService = authorizationService;
        UserDB = userDB;
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
                Claim? userIdClaim = ContextAccessor.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim == null) throw new Exception($"Cannot determine the current user because the claim \"{ClaimTypes.NameIdentifier}\" could not be found.");
                Guid? userId = await UserDB.GetUserIdByGraphId(userIdClaim.Value).ConfigureAwait(false);

                CachedAzureIdentifier = userIdClaim.Value;
                UserId = userId;
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
