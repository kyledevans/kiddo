namespace Kiddo.Web.Security;

using Microsoft.IdentityModel.Tokens;

/// <summary>
/// Interface for generation of JWT pairs (both refresh tokens and access tokens).
/// </summary>
public interface IJwtPairGenerator
{
    SymmetricSecurityKey SigningKey { get; }

    SigningCredentials SigningCredentials { get; }

    /// <summary>
    /// Validation parameters just for refresh tokens.
    /// </summary>
    public TokenValidationParameters RefreshTokenValidationParameters { get; }

    /// <summary>
    /// Validation parameters just for access tokens.
    /// </summary>
    public TokenValidationParameters AccessTokenValidationParameters { get; }

    /// <summary>
    /// Validation parameters for both refresh and access tokens.
    /// </summary>
    public TokenValidationParameters AllTokenValidationParameters { get; }

    /// <summary>
    /// Generate a refresh token for the specified user.
    /// </summary>
    /// <param name="userId"></param>
    /// <returns>JWT refresh token.</returns>
    string GenerateRefreshToken(Guid userId);

    /// <summary>
    /// Validate a refresh token and return the user id.  If validation failed, this will return null.
    /// </summary>
    /// <param name="refreshToken">JWT refresh token to be validated.</param>
    /// <returns>User Id.  Null if validation failed.</returns>
    Guid? ValidateRefreshToken(string refreshToken);

    /// <summary>
    /// Generate a new access token derived from the specified refresh token.
    /// </summary>
    /// <param name="refreshToken"></param>
    /// <returns>JWT access token.</returns>
    string GenerateAccessToken(string refreshToken);

    /// <summary>
    /// Validate an access token and return the user id.  If validation failed, this will return null.
    /// </summary>
    /// <param name="accessToken">JWT access token to be validated.</param>
    /// <returns>AspNet Identity user Id.  Null if validation failed.</returns>
    Guid? ValidateAccessToken(string accessToken);
}