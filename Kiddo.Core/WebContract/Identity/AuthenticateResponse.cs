namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class AuthenticateResponse
{
    public bool Success { get; set; }
    public Guid UserId { get; set; }
    public string RefreshToken { get; set; } = String.Empty;
    public string AccessToken { get; set; } = String.Empty;
}
