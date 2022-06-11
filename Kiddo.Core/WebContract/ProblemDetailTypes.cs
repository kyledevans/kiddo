namespace Kiddo.WebContract;

public static class ProblemDetailTypes
{
    /// <summary>
    /// Base URI for all problem detail types.
    /// </summary>
    public const string BaseUri = "error://kiddo.web/";    // Make sure this ends with a trailing slash.  Also make sure that changes here are replicated at the client level.
    public const string AuthenticationMethodNotEnabled = $"{BaseUri}authentication-method-not-enabled";
    public const string UserNotRegistered = $"{BaseUri}user-not-registered";
    public const string EmailNotConfirmed = $"{BaseUri}email-not-confirmed";
}
