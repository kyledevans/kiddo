namespace Kiddo.Web.Security.AzureAd;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

public class AzureAdClaimsTransformation : IClaimsTransformation
{
    private DAL.UserDAL UserDB { get; set; }
    private IAuthorizationService AuthorizationService { get; set; }
    private RoleManager<Database.Models.Role> RoleManager { get; set; }
    private UserManager<Database.Models.User> UserManager { get; set; }

    public AzureAdClaimsTransformation(DAL.UserDAL userDB, IAuthorizationService authorizationService, UserManager<Database.Models.User> userManager, RoleManager<Database.Models.Role> roleManager)
    {
        UserDB = userDB;
        AuthorizationService = authorizationService;
        RoleManager = roleManager;
        UserManager = userManager;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        // https://gunnarpeipman.com/aspnet-core-adding-claims-to-existing-identity/

        ClaimsPrincipal clone = principal.Clone();

        if (clone.Identity == null)
            return principal;

        ClaimsIdentity newIdentity = (ClaimsIdentity)clone.Identity;

        Claim? userIdClaim = newIdentity.Claims.FirstOrDefault(c => c.Type == Microsoft.Identity.Web.ClaimConstants.ObjectId);
        if (userIdClaim == null) throw new Exception($"Cannot determine the current user because the claim \"{Microsoft.Identity.Web.ClaimConstants.ObjectId}\" could not be found.");

        Database.Models.User? dbUser = await UserManager.FindByLoginAsync(SecurityConstants.Scheme.AzureAd, userIdClaim.Value).ConfigureAwait(false);

        if (dbUser != null)
        {
            IList<string> roles = await UserManager.GetRolesAsync(dbUser).ConfigureAwait(false);

            foreach (string role in roles)
            {
                Claim claim = new(newIdentity.RoleClaimType, role);
                newIdentity.AddClaim(claim);
            }
        }

        return clone;
    }
}
