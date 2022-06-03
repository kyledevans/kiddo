namespace Kiddo.Web.Security;

public interface IJwtUtils
{
    /// <summary>
    /// Generate a refresh token for the specified user.
    /// </summary>
    /// <param name="aspNetUserId"></param>
    /// <returns>JWT refresh token.</returns>
    string GenerateRefreshToken(Guid aspNetUserId);

    /// <summary>
    /// Validate a refresh token and return the AspNet Identity user Id.  If validation failed, this will return null.
    /// </summary>
    /// <param name="refreshToken">JWT refresh token to be validated.</param>
    /// <returns>AspNet Identity user Id.  Null if validation failed.</returns>
    string? ValidateRefreshToken(string refreshToken);

    /// <summary>
    /// Generate a new access token derived from the specified refresh token.
    /// </summary>
    /// <param name="refreshToken"></param>
    /// <returns>JWT access token.</returns>
    string GenerateAccessToken(string refreshToken);

    /// <summary>
    /// Validate an access token and return the AspNet Identity user Id.  If validation failed, this will return null.
    /// </summary>
    /// <param name="accessToken">JWT access token to be validated.</param>
    /// <returns>AspNet Identity user Id.  Null if validation failed.</returns>
    Guid? ValidateAccessToken(string accessToken);
}