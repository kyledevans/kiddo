namespace Kiddo.WebContract.AzureAd;

/// <summary>
/// Result codes for registration.
/// </summary>
public enum RegisterStatusCodeType
{
    /// <summary>
    /// Success.
    /// </summary>
    Success = 0,

    /// <summary>
    /// One or more of the profile fields retrieved from Microsoft Graph are unusable within the system.  This can indicate they are missing, empty, too long, or a malformed email address.
    /// </summary>
    InvalidFields = 1,

    /// <summary>
    /// User is already registered.
    /// </summary>
    AlreadyRegistered = 2,

    /// <summary>
    /// Email address is taken by an existing application user account, but they are unconfirmed so automatic linking was not possible.
    /// </summary>
    EmailTakenUnverified = 3,

    /// <summary>
    /// Unknown error.
    /// </summary>
    UnknownError = 4
}
