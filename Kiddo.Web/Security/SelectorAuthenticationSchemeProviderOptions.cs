namespace Kiddo.Web.Security;

using System.IdentityModel.Tokens.Jwt;

public class SelectorAuthenticationSchemeProviderOptions
{
    public List<Func<JwtSecurityToken, string?>> Selectors { get; set; } = new();
}
