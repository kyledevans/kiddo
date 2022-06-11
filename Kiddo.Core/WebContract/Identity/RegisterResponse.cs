namespace Kiddo.WebContract.Identity;

public class RegisterResponse
{
    public bool Success { get; set; }
    public AuthenticateResponse? AuthenticateResponse { get; set; }
    public List<IdentityError> Errors { get; set; } = new();
}
