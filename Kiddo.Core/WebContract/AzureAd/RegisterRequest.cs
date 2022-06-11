namespace Kiddo.WebContract.AzureAd;

public class RegisterRequest
{
    public string DisplayName { get; set; } = String.Empty;
    public string Email { get; set; } = String.Empty;
    public string GivenName { get; set; } = String.Empty;
    public string Surname { get; set; } = String.Empty;
}
