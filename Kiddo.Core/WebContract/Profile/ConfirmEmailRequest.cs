namespace Kiddo.WebContract.Profile;

public class ConfirmEmailRequest
{
    public string? Email { get; set; }
    public string Token { get; set; } = String.Empty;
}
