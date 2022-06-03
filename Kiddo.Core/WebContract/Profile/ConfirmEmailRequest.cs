namespace Kiddo.WebContract.Profile;

#nullable enable annotations

public class ConfirmEmailRequest
{
    public string? Email { get; set; }
    public string Token { get; set; } = String.Empty;
}
