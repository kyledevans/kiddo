namespace Kiddo.Web.Security;

using Microsoft.IdentityModel.Tokens;

/// <summary>
/// Identical to SymmetricSecurityKey but since this is a subtype we can target this for dependency injection without worrying about conflicts.
/// </summary>
public class JwtSigningKey : SymmetricSecurityKey
{
    public JwtSigningKey(byte[] key) :
        base(key)
    {
    }
}
