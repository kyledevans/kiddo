namespace Kiddo.Web.Models;

using AutoMapper;
using Kiddo.Web.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

public class UserModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private IMapper Mapper { get; set; }
    private ICurrentUserProvider CurrentUser { get; set; }
    private IAuthorizationService AuthorizationService { get; set; }
    private HttpContext HttpContext { get; set; }
    private UserManager<Database.Models.User> UserManager { get; set; }

    public UserModel(DAL.KiddoDAL db, DAL.UserDAL userDB, UserManager<Database.Models.User> userManager, IMapper mapper, ICurrentUserProvider currentUser, IAuthorizationService authorizationService, IHttpContextAccessor httpContextAccessor)
    {
        DB = db;
        UserDB = userDB;
        Mapper = mapper;
        CurrentUser = currentUser;
        AuthorizationService = authorizationService;
        UserManager = userManager;

        if (httpContextAccessor.HttpContext == null) throw new ArgumentException("HttpContext is null which indicates a call without an active Http request.", nameof(httpContextAccessor));
        HttpContext = httpContextAccessor.HttpContext;
    }

    public async Task<WebContract.User.SearchUsersResult> SearchUsers(int maxCount)
    {
        WebContract.User.SearchUsersResult retval = new();

        maxCount = maxCount > 0 ? maxCount : Int32.MaxValue;    // Convert <= 0 to return everything.

        List<Database.Models.User> dbUsers = await UserDB.GetAllUsers(maxCount == Int32.MaxValue ? maxCount : (maxCount + 1)).ConfigureAwait(false);
        retval.Users = Mapper.Map<List<Database.Models.User>, List<WebContract.User.SearchUser>>(dbUsers);
        retval.IsOverMax = retval.Users.Count >= maxCount;

        if (retval.Users.Count > 0 && retval.Users.Count >= maxCount)
        {
            retval.Users.RemoveAt(retval.Users.Count - 1);
        }

        return retval;
    }

    public async Task<WebContract.User.User> GetUser(Guid userId)
    {
        Database.Models.User dbUser = await UserDB.GetUser(userId).ConfigureAwait(false);
        WebContract.User.User retval = Mapper.Map<Database.Models.User, WebContract.User.User>(dbUser);
        string? role = (await UserManager.GetRolesAsync(dbUser).ConfigureAwait(false)).FirstOrDefault();
        retval.SecurityRole = role == null ? null : Enum.Parse<Constants.SecurityRoleType>(role);
        retval.HasPassword = await UserManager.HasPasswordAsync(dbUser).ConfigureAwait(false);
        return retval;
    }

    public async Task<WebContract.User.User> CreateUser(WebContract.User.User newUser)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        // Make sure the currently logged in user has the correct permissions to assign the role specified for the new user.
        List<Constants.SecurityRoleType> allowedRoles = new();

        if ((await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Constants.SecurityRoleType.SuperAdministrator)).ConfigureAwait(false)).Succeeded)
        {
            allowedRoles.Add(Constants.SecurityRoleType.SuperAdministrator);
            allowedRoles.Add(Constants.SecurityRoleType.Administrator);
            allowedRoles.Add(Constants.SecurityRoleType.User);
            allowedRoles.Add(Constants.SecurityRoleType.ReadOnlyUser);
        }
        else if ((await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Constants.SecurityRoleType.Administrator)).ConfigureAwait(false)).Succeeded)
        {
            allowedRoles.Add(Constants.SecurityRoleType.Administrator);
            allowedRoles.Add(Constants.SecurityRoleType.User);
            allowedRoles.Add(Constants.SecurityRoleType.ReadOnlyUser);
        }

        if (newUser.SecurityRole != null && !allowedRoles.Contains((Constants.SecurityRoleType)newUser.SecurityRole)) throw new UnauthorizedAccessException($"Currently logged in user is not allowed to assign to role \"{newUser.SecurityRole}\".");

        // Create the user.
        Database.Models.User dbUser = Mapper.Map<WebContract.User.User, Database.Models.User>(newUser);
        dbUser.Id = Guid.Empty;

        await UserManager.CreateAsync(dbUser).ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);
        WebContract.User.User retval = Mapper.Map<Database.Models.User, WebContract.User.User>(dbUser);
        retval.SecurityRole = newUser.SecurityRole;
        retval.HasPassword = await UserManager.HasPasswordAsync(dbUser).ConfigureAwait(false);
        return retval;
    }

    public async Task<WebContract.User.User> UpdateUser(WebContract.User.User update)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        Database.Models.User dbUser = await UserDB.GetUser(update.UserId).ConfigureAwait(false);

        // Check if the role assignment is being changed for the currently logged in user.
        if (await CurrentUser.GetUserIdRequired().ConfigureAwait(false) == update.UserId)
        {
            IList<string> roles = await UserManager.GetRolesAsync(dbUser).ConfigureAwait(false);
            string? newRole = update.SecurityRole == null ? null : update.SecurityRole.ToString();

            IEnumerable<string> differences = newRole == null ? roles : roles.ToList().Except(new[] { newRole.ToString() });

            if (differences.Any() || roles.Count != 1)
            {
                throw new InvalidOperationException($"Cannot modify the current user's role.");
            }
        }

        // Make sure the currently logged in user has the correct permissions to assign the role specified for the new user.
        List<Constants.SecurityRoleType> allowedRoles = new();

        if ((await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Constants.SecurityRoleType.SuperAdministrator)).ConfigureAwait(false)).Succeeded)
        {
            allowedRoles.Add(Constants.SecurityRoleType.SuperAdministrator);
            allowedRoles.Add(Constants.SecurityRoleType.Administrator);
            allowedRoles.Add(Constants.SecurityRoleType.User);
            allowedRoles.Add(Constants.SecurityRoleType.ReadOnlyUser);
        }
        else if ((await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Constants.SecurityRoleType.Administrator)).ConfigureAwait(false)).Succeeded)
        {
            allowedRoles.Add(Constants.SecurityRoleType.Administrator);
            allowedRoles.Add(Constants.SecurityRoleType.User);
            allowedRoles.Add(Constants.SecurityRoleType.ReadOnlyUser);
        }

        if (update.SecurityRole != null && !allowedRoles.Contains((Constants.SecurityRoleType)update.SecurityRole)) throw new UnauthorizedAccessException($"Currently logged in user is not allowed to assign to role \"{update.SecurityRole}\".");

        if (update.SecurityRole != null && !allowedRoles.Contains((Constants.SecurityRoleType)update.SecurityRole)) throw new UnauthorizedAccessException($"Currently logged in user is not allowed to modify user with current role of \"{update.SecurityRole}\".");

        List<string> currentRoles = (await UserManager.GetRolesAsync(dbUser).ConfigureAwait(false)).Where(r => r != update.SecurityRole.ToString()).ToList();
        await UserManager.RemoveFromRolesAsync(dbUser, currentRoles).ConfigureAwait(false);
        await UserManager.AddToRoleAsync(dbUser, update.SecurityRole.ToString()).ConfigureAwait(false);

        dbUser.DisplayName = update.DisplayName;
        dbUser.GivenName = update.GivenName;
        dbUser.Surname = update.Surname;
        await DB.SaveChanges().ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);

        WebContract.User.User retval = Mapper.Map<Database.Models.User, WebContract.User.User>(dbUser);
        retval.SecurityRole = update.SecurityRole;
        retval.HasPassword = await UserManager.HasPasswordAsync(dbUser).ConfigureAwait(false);
        return retval;
    }

    public async Task DeleteUsers(List<Guid> userIds)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        List<Database.Models.User> dbUsers = await UserDB.GetUsers(userIds).ConfigureAwait(false);
        bool isSuperAdmin = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Security.SecurityConstants.Policy.SuperAdministrator).ConfigureAwait(false)).Succeeded;
        bool isAdmin = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Security.SecurityConstants.Policy.Administrator).ConfigureAwait(false)).Succeeded;
        List<string> allowedRoles = new();

        if (isSuperAdmin)
        {
            allowedRoles.Add(Constants.SecurityRoleType.SuperAdministrator.ToString());
            allowedRoles.Add(Constants.SecurityRoleType.Administrator.ToString());
            allowedRoles.Add(Constants.SecurityRoleType.User.ToString());
            allowedRoles.Add(Constants.SecurityRoleType.ReadOnlyUser.ToString());
        }
        else if (isAdmin)
        {
            allowedRoles.Add(Constants.SecurityRoleType.Administrator.ToString());
            allowedRoles.Add(Constants.SecurityRoleType.User.ToString());
            allowedRoles.Add(Constants.SecurityRoleType.ReadOnlyUser.ToString());
        }

        foreach (Database.Models.User dbUser in dbUsers)
        {
            IList<string> deleteRoles = await UserManager.GetRolesAsync(dbUser).ConfigureAwait(false);

            if (deleteRoles.Except(allowedRoles).Any()) throw new UnauthorizedAccessException($"Currently logged in user is not allowed to delete user(s) based on role.");

            await UserManager.DeleteAsync(dbUser).ConfigureAwait(false);
        }

        await trans.CommitAsync().ConfigureAwait(false);
    }
}
