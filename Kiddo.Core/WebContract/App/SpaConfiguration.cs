namespace Kiddo.WebContract.App;

/// <summary>
/// Configuration for the client-side SPA.
/// </summary>
public class SpaConfiguration
{
    // Note: Nullability needs to be enforced at application startup.  Don't add this into the DI system until AFTER we have verified that everything is actually not-null.

    /// <summary>
    /// The public URL for the app.
    /// </summary>
    public string Url { get; set; } = String.Empty;

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

    /// <summary>
    /// List of supported authentication methods.
    /// </summary>
    public List<AuthenticationMethodType> AuthMethods { get; set; } = new();

    /// <summary>
    /// Optional default authentication method.
    /// </summary>
    public AuthenticationMethodType? DefaultAuthMethod { get; set; }

    public bool IsEmailConfirmationRequired { get; set; } = true;
}
