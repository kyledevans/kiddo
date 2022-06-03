namespace Kiddo.Database.Models;

using Microsoft.AspNetCore.Identity;

public class User : IdentityUser<Guid>
{
#nullable disable
    public string DisplayName { get; set; }
#nullable restore
    public string? GivenName { get; set; }
    public string? Surname { get; set; }

    public ICollection<UserAzureAd> UserAzureAds { get; set; }
    public ICollection<Entry> Entries { get; set; }

    public User()
    {
        UserAzureAds = new HashSet<UserAzureAd>();
        Entries = new HashSet<Entry>();
    }
}

public class UserClaim : IdentityUserClaim<Guid>
{ }

public class UserRole : IdentityUserRole<Guid>
{ }

public class UserLogin: IdentityUserLogin<Guid>
{ }

public class RoleClaim : IdentityRoleClaim<Guid>
{ }

public class UserToken : IdentityUserToken<Guid>
{ }
