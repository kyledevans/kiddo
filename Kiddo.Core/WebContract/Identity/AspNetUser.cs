namespace Kiddo.WebContract.Identity;

public class AspNetUser
{
    public Guid AspNetUserId { get; set; }
    public string Email { get; set; } = String.Empty;
}
