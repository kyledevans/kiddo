namespace Kiddo.Web.Security;

/// <summary>
/// Determines the initial settings for new user registrations.  The primary use case is for the "first run" after
/// installation, where the first user account created is automatically granted super administrator privileges.  From
/// then on new registrations will only be read only users.
/// </summary>
public interface IUserRegistrationBehavior
{
    Task<bool> GetIsRegistrationAllowed();
    Task<Constants.SecurityRoleType?> GetInitialRole();
    Task<bool> GetIsAutoLoginAllowed();
    Task<bool> GetIsEmailAutoConfirmed();
}
