namespace Kiddo.WebContract.User;

public class User
{
    public Guid UserId { get; set; }
    public Constants.SecurityRoleType? SecurityRole { get; set; }
    public string? ExternalId { get; set; }
    public string DisplayName { get; set; } = String.Empty;
    public string? GivenName { get; set; }
    public string? Surname { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public bool HasPassword { get; set; }
}
