namespace Kiddo.Web.Security;

using Kiddo.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

public class UserRegistrationBehavior : IUserRegistrationBehavior
{
    private DAL.UserDAL UserDB { get; set; }
    private bool IsInitialized { get; set; }
    private SecurityRoleType? InitialRole { get; set; }
    private bool IsAutoLoginAllowed { get; set; }
    private bool IsEmailAutoConfirmed { get; set; }
    private IAuthorizationService AuthorizationService { get; set; }
    private HttpContext CurrentHttpContext { get; set; }
    private bool IsRegistrationAllowed { get; set; }
    private Implementations.SpaOptions SpaOptions { get; set; }

    public UserRegistrationBehavior(DAL.UserDAL userDb, IAuthorizationService authorizationService, IHttpContextAccessor httpContextAccessor, IOptionsMonitor<Implementations.SpaOptions> spaOptionsMonitor)
    {
        UserDB = userDb;
        AuthorizationService = authorizationService;
        SpaOptions = spaOptionsMonitor.CurrentValue;

        if (httpContextAccessor.HttpContext == null) throw new NullReferenceException(nameof(httpContextAccessor.HttpContext));

        CurrentHttpContext = httpContextAccessor.HttpContext;
    }

    private async Task Initialize()
    {
        if (IsInitialized) return;

        int allUsersCount = await UserDB.GetAllUsersCount().ConfigureAwait(false);
        //bool isAspNetIdentityJwt = (await AuthorizationService.AuthorizeAsync(CurrentHttpContext.User, SecurityConstants.Policy.AspNetIdentity).ConfigureAwait(false)).Succeeded;
        bool isAzureAdJwt = (await AuthorizationService.AuthorizeAsync(CurrentHttpContext.User, SecurityConstants.Policy.AzureAd).ConfigureAwait(false)).Succeeded;

        InitialRole = allUsersCount == 0 ? SecurityRoleType.SuperAdministrator : SecurityRoleType.ReadOnlyUser;
        IsAutoLoginAllowed = InitialRole == SecurityRoleType.SuperAdministrator;
        IsEmailAutoConfirmed = isAzureAdJwt || allUsersCount == 0;  // Auto confirm the initial account, that way they don't accidentally get locked out.
        IsRegistrationAllowed = allUsersCount == 0 || SpaOptions.IsRegistrationEnabled;
        IsInitialized = true;
    }

    public async Task<SecurityRoleType?> GetInitialRole()
    {
        await Initialize().ConfigureAwait(false);
        return InitialRole;
    }

    public async Task<bool> GetIsAutoLoginAllowed()
    {
        await Initialize().ConfigureAwait(false);
        return IsAutoLoginAllowed;
    }

    public async Task<bool> GetIsEmailAutoConfirmed()
    {
        await Initialize().ConfigureAwait(false);
        return IsEmailAutoConfirmed;
    }

    public async Task<bool> GetIsRegistrationAllowed()
    {
        await Initialize().ConfigureAwait(false);
        return IsRegistrationAllowed;
    }
}
