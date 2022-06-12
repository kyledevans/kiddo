namespace Kiddo.Web.Security;

using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public class JwtUtils : IJwtUtils
{
    private JwtSigningKey SigningKey { get; set; }

    public JwtUtils(JwtSigningKey signingKey)
    {
        SigningKey = signingKey;
    }

    public string GenerateRefreshToken(Guid aspNetUserId)
    {
        // Generate token that is valid for 7 days.
        JwtSecurityTokenHandler tokenHandler = new();
        SecurityTokenDescriptor tokenDescriptor = new() {
            Subject = new ClaimsIdentity(new[] { new Claim(JwtRegisteredClaimNames.Sub, aspNetUserId.ToString()) }),
            Audience = SecurityConstants.AspNetIdentity.RefreshTokenAudience,
            Issuer = SecurityConstants.AspNetIdentity.Issuer,
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha512Signature),
            Claims = new Dictionary<string, object>() {
                { ClaimConstants.Scope, new string[] { SecurityConstants.Scopes.KiddoAccess } }
            }
        };
        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string? ValidateRefreshToken(string refreshToken)
    {
        if (refreshToken == null) return null;

        JwtSecurityTokenHandler tokenHandler = new();

        try
        {
            tokenHandler.ValidateToken(refreshToken, new() {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = SigningKey,
                ValidIssuer = SecurityConstants.AspNetIdentity.Issuer,
                ValidAudience = SecurityConstants.AspNetIdentity.RefreshTokenAudience,
                ClockSkew = TimeSpan.Zero   // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
            }, out SecurityToken validatedToken);

            JwtSecurityToken jwtToken = (JwtSecurityToken)validatedToken;
            string aspNetUserId = jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Sub).Value;

            // return user id from JWT token if validation successful
            return aspNetUserId;
        }
        catch
        {
            // return null if validation fails
            return null;
        }
    }

    public string GenerateAccessToken(string refreshToken)
    {
        string? aspNetUserId = ValidateRefreshToken(refreshToken);

        if (aspNetUserId == null)
        {
            throw new Exception("Cannot generate a new access token because the refresh token is invalid.");
        }

        // Generate token that is valid for 1 hour
        JwtSecurityTokenHandler tokenHandler = new();
        SecurityTokenDescriptor tokenDescriptor = new() {
            Subject = new ClaimsIdentity(new[] { new Claim(JwtRegisteredClaimNames.Sub, aspNetUserId) }),
            Audience = SecurityConstants.AspNetIdentity.AccessTokenAudience,
            Issuer = SecurityConstants.AspNetIdentity.Issuer,
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha512Signature),
            Claims = new Dictionary<string, object>() {
                { ClaimConstants.Scope, new string[] { SecurityConstants.Scopes.KiddoAccess } }
            }
        };
        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public Guid? ValidateAccessToken(string accessToken)
    {
        if (accessToken == null) return null;

        JwtSecurityTokenHandler tokenHandler = new();

        try
        {
            tokenHandler.ValidateToken(accessToken, new() {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = SigningKey,
                ValidIssuer = SecurityConstants.AspNetIdentity.Issuer,
                ValidAudience = SecurityConstants.AspNetIdentity.AccessTokenAudience,
                ClockSkew = TimeSpan.Zero   // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
            }, out SecurityToken validatedToken);

            JwtSecurityToken jwtToken = (JwtSecurityToken)validatedToken;
            Guid aspNetUserId = Guid.Parse(jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Sub).Value);

            // return user id from JWT token if validation successful
            return aspNetUserId;
        }
        catch
        {
            // return null if validation fails
            return null;
        }
    }
}
