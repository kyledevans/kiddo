namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class AspNetUser
{
    public Guid AspNetUserId { get; set; }
    public string Email { get; set; } = String.Empty;
}
