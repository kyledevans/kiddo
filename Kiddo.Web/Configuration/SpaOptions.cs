namespace Kiddo.Web.Configuration;

public class SpaOptions
{
    public string Url { get; set; } = String.Empty;
    public List<WebContract.AuthenticationMethodType> AuthMethods { get; set; } = new();
    public WebContract.AuthenticationMethodType? DefaultAuthMethod { get; set; }
    public bool IsRegistrationEnabled { get; set; } = true;
    public bool IsEmailConfirmationRequired { get; set; } = true;
}
