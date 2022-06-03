namespace Kiddo.WebContract;

public enum AuthenticationMethodType
{
    /// <summary>
    /// Azure Active Directory authentication.
    /// </summary>
    AzureAd = 1,

    /// <summary>
    /// Builtin username/password authentication.
    /// </summary>
    Password = 2
}
