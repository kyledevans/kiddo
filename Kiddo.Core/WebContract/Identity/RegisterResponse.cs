namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class RegisterResponse
{
    public bool Success { get; set; }
    public AuthenticateResponse? AuthenticateResponse { get; set; }
    public List<IdentityError> Errors { get; set; } = new();
}
