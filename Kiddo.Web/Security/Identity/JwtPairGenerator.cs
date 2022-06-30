namespace Kiddo.Web.Security.Identity;

using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public class JwtPairGenerator : IJwtPairGenerator
{
    public SymmetricSecurityKey SigningKey { get; private set; }
    public SigningCredentials SigningCredentials { get; private set; }
    public TokenValidationParameters RefreshTokenValidationParameters { get; private set; }
    public TokenValidationParameters AccessTokenValidationParameters { get; private set; }
    public TokenValidationParameters AllTokenValidationParameters { get; private set; }

    public JwtPairGenerator(IConfiguration configuration)
    {
        string? secretKey = configuration.GetValue<string?>(SecurityConstants.AspNetIdentity.SecurityKeyOptions);
        if (secretKey == null) throw new Exception($"{SecurityConstants.AspNetIdentity.SecurityKeyOptions} was not defined in appsettings.json.");
        SigningKey = new(System.Text.Encoding.UTF8.GetBytes(secretKey));
        SigningCredentials = new(SigningKey, SecurityAlgorithms.HmacSha512Signature);

        RefreshTokenValidationParameters = new() {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = SigningKey,
            ValidIssuer = SecurityConstants.AspNetIdentity.Issuer,
            ValidAudience = SecurityConstants.AspNetIdentity.RefreshTokenAudience,
            ClockSkew = TimeSpan.Zero   // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
        };

        AccessTokenValidationParameters = new() {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = SigningKey,
            ValidIssuer = SecurityConstants.AspNetIdentity.Issuer,
            ValidAudience = SecurityConstants.AspNetIdentity.AccessTokenAudience,
            ClockSkew = TimeSpan.Zero   // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
        };

        AllTokenValidationParameters = new() {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = SigningKey,
            ValidIssuer = SecurityConstants.AspNetIdentity.Issuer,
            ValidAudiences = new[] { SecurityConstants.AspNetIdentity.AccessTokenAudience, SecurityConstants.AspNetIdentity.RefreshTokenAudience },
            ClockSkew = TimeSpan.Zero   // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
        };
    }

    public string GenerateRefreshToken(Guid userId)
    {
        // Generate token that is valid for 7 days.
        JwtSecurityTokenHandler tokenHandler = new();
        SecurityTokenDescriptor tokenDescriptor = new() {
            Subject = new ClaimsIdentity(new[] { new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()) }),
            Audience = SecurityConstants.AspNetIdentity.RefreshTokenAudience,
            Issuer = SecurityConstants.AspNetIdentity.Issuer,
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = SigningCredentials,
            Claims = new Dictionary<string, object>() {
                { ClaimConstants.Scope, new string[] { SecurityConstants.Scopes.KiddoAccess } }
            }
        };
        SecurityToken token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public Guid? ValidateRefreshToken(string refreshToken)
    {
        if (refreshToken == null) return null;

        JwtSecurityTokenHandler tokenHandler = new();

        try
        {
            tokenHandler.ValidateToken(refreshToken, RefreshTokenValidationParameters, out SecurityToken validatedToken);

            JwtSecurityToken jwtToken = (JwtSecurityToken)validatedToken;
            Guid userId = Guid.Parse(jwtToken.Claims.First(x => x.Type == JwtRegisteredClaimNames.Sub).Value);

            // return user id from JWT token if validation successful
            return userId;
        }
        catch
        {
            // return null if validation fails
            return null;
        }
    }

    public string GenerateAccessToken(string refreshToken)
    {
        Guid? userId = ValidateRefreshToken(refreshToken);

        if (userId == null) throw new Exception("Cannot generate a new access token because the refresh token is invalid.");

        // Generate token that is valid for 1 hour
        JwtSecurityTokenHandler tokenHandler = new();
        SecurityTokenDescriptor tokenDescriptor = new() {
            Subject = new ClaimsIdentity(new[] { new Claim(JwtRegisteredClaimNames.Sub, ((Guid)userId).ToString()) }),
            Audience = SecurityConstants.AspNetIdentity.AccessTokenAudience,
            Issuer = SecurityConstants.AspNetIdentity.Issuer,
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = SigningCredentials,
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
            tokenHandler.ValidateToken(accessToken, AccessTokenValidationParameters, out SecurityToken validatedToken);

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
