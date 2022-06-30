namespace Kiddo.Web.Security.Selector;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Kiddo.Web.Security.AzureAd;
using Kiddo.Web.Security.Identity;

public static class SelectorDelegates
{
    public static string? IdentityAuthenticationSchemeProviderSelector(JwtSecurityToken token)
    {
        return token.Issuer == SecurityConstants.AspNetIdentity.Issuer ? SecurityConstants.Scheme.AspNetIdentity : null;
    }

    public static Type? IdentityClaimsTransformationSelector(ClaimsPrincipal principal)
    {
        Claim? issuerClaim = principal.Claims.Where(c => c.Type == SecurityConstants.ClaimType.Issuer).FirstOrDefault();
        return issuerClaim?.Value == SecurityConstants.AspNetIdentity.Issuer ? typeof(IdentityClaimsTransformation) : null;
    }

    public static string? AzureAdAuthenticationSchemeProviderSelector(JwtSecurityToken token)
    {
        return token.Issuer.StartsWith(SecurityConstants.AzureAd.IssuerPrefix) ? SecurityConstants.Scheme.AzureAd : null;
    }

    public static Type? AzureAdClaimsTranformationSelector(ClaimsPrincipal principal)
    {
        Claim? issuerClaim = principal.Claims.Where(c => c.Type == SecurityConstants.ClaimType.Issuer).FirstOrDefault();
        return issuerClaim != null && issuerClaim.Value.StartsWith(SecurityConstants.AzureAd.IssuerPrefix) ? typeof(AzureAdClaimsTransformation) : null;
    }
}
