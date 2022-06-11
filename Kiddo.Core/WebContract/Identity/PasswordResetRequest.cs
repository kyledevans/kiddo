namespace Kiddo.WebContract.Identity;

public class PasswordResetRequest
{
    public string Email { get; set; } = String.Empty;
    public string Password { get; set; } = String.Empty;
    public string Token { get; set; } = String.Empty;
}
