namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class SendPasswordResetRequest
{
    public string Email { get; set; } = String.Empty;
}
