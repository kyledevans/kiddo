namespace Kiddo.Database.Models;

public class UserAzureAd
{
    public int UserAzureAdId { get; set; }
    public Guid UserId { get; set; }
#nullable disable
    public string GraphId { get; set; }
    public string DisplayName { get; set; }
    public string GivenName { get; set; }
    public string Surname { get; set; }
#nullable restore
    public string? Email { get; set; }

#nullable disable
    public User User { get; set; }
#nullable restore
}
