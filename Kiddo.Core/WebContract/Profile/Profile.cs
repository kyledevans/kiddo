namespace Kiddo.WebContract.Profile;

#nullable enable annotations

public class Profile
{
    public Guid UserId { get; set; }
    public string? GivenName { get;set; }
    public string? Surname { get; set; }
    public string? Email { get; set; }
    public string DisplayName { get; set; } = String.Empty;
    public bool IsEmailConfirmed { get; set; }
    public bool HasPassword { get; set; }
    public PolicySummary Policies { get; set; } = new();
}
