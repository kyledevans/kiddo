namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class AuthenticateRequest
{
    public string Username { get; set; } = String.Empty;
    public string Password { get; set; } = String.Empty;
}
