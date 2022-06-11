namespace Kiddo.WebContract.Profile;

public class PolicySummary
{
    public bool IsSuperAdministrator { get; set; }
    public bool IsAdministrator { get; set; }
    public bool IsUser { get; set; }
    public bool IsReadOnlyUser { get; set; }
    public bool IsAzureAd { get; set; }
    public bool IsAspNetIdentity { get; set; }
    // Note: This is not going to have the policies for access and refresh tokens.  Because this PolicySummary DTO is
    // intended to be used only by the SPA code.  Which will always have access to both types of tokens as long as
    // it's using AspNetIdentity auth.
}
