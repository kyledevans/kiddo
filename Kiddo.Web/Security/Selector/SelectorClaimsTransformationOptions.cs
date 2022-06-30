namespace Kiddo.Web.Security.Selector;

using System.Security.Claims;

public class SelectorClaimsTransformationOptions
{
    public List<Func<ClaimsPrincipal, Type?>> Selectors { get; set; } = new();
}
