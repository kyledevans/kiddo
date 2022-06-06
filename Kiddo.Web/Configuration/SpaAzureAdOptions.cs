namespace Kiddo.Web.Configuration;

/// <summary>
/// Configuration for the SPA client to support MSAL.
/// </summary>
public class SpaAzureAdOptions
{
    /// <summary>
    /// Client Id for the SPA application.
    /// <see href="https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration"/>
    /// </summary>
    public string MsalClientId { get; set; } = String.Empty;

    /// <summary>
    /// Authority URL for the SPA application.
    /// <see href="https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration"/>
    /// </summary>
    public string MsalAuthority { get; set; } = String.Empty;

    /// <summary>
    /// MSAL scopes to reference.  A minimal application will only need access to the server backend - so a single scope will suffice.  These scopes
    /// most likely need to be in a full URI format.
    /// <see href="https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration"/>
    /// </summary>
    public List<string> MsalScopes { get; set; } = new();
}
