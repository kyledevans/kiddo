namespace Kiddo.WebContract.Identity;

public class AuthenticateRequest
{
    public string Username { get; set; } = String.Empty;
    public string Password { get; set; } = String.Empty;
}
