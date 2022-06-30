namespace Kiddo.Web.Security.Selector;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;

/// <summary>
/// Parse "Authorization" header for JWT tokens, then dispatches to the JWT scheme that's responsible for handling the token.
/// </summary>
public class SelectorAuthenticationSchemeProvider : AuthenticationSchemeProvider
{
    private IHttpContextAccessor HttpContextAccessor { get; set; }
    private IOptionsMonitor<SelectorAuthenticationSchemeProviderOptions> SelectorOptionsMonitor { get; set; }

    public SelectorAuthenticationSchemeProvider(IHttpContextAccessor httpContextAccessor, IOptions<AuthenticationOptions> options, IOptionsMonitor<SelectorAuthenticationSchemeProviderOptions> selectorOptionsMonitor) : base(options)
    {
        HttpContextAccessor = httpContextAccessor;
        SelectorOptionsMonitor = selectorOptionsMonitor;
    }

    protected SelectorAuthenticationSchemeProvider(IHttpContextAccessor httpContextAccessor, IOptions<AuthenticationOptions> options, IDictionary<string, AuthenticationScheme> schemes, IOptionsMonitor<SelectorAuthenticationSchemeProviderOptions> selectorOptionsMonitor) : base(options, schemes)
    {
        HttpContextAccessor = httpContextAccessor;
        SelectorOptionsMonitor = selectorOptionsMonitor;
    }

    private async Task<AuthenticationScheme?> GetRequestAuthScheme()
    {
        HttpContext? context = HttpContextAccessor.HttpContext;

        if (context == null) return null;

        if (context.Request.Headers.TryGetValue(HeaderNames.Authorization, out Microsoft.Extensions.Primitives.StringValues authHeader) && authHeader.Count == 1)
        {
            string encodedToken = authHeader.First().Substring(JwtBearerDefaults.AuthenticationScheme.Length + 1);
            JwtSecurityTokenHandler jwtHandler = new();
            JwtSecurityToken token = jwtHandler.ReadJwtToken(encodedToken);
            string? authMethod = null;

            List<Func<JwtSecurityToken, string?>> selectors = SelectorOptionsMonitor.CurrentValue.Selectors;

            foreach (Func<JwtSecurityToken, string?> selector in selectors)
            {
                authMethod = selector(token);
                if (authMethod != null) break;
            }

            if (authMethod != null)
                return await GetSchemeAsync(authMethod).ConfigureAwait(false);
        }

        return null;
    }

    public override async Task<IEnumerable<AuthenticationScheme>> GetRequestHandlerSchemesAsync()
    {
        AuthenticationScheme? authScheme = await GetRequestAuthScheme().ConfigureAwait(false);

        return authScheme != null ? new[] { authScheme } : await base.GetRequestHandlerSchemesAsync().ConfigureAwait(false);
    }

    public override async Task<AuthenticationScheme?> GetDefaultAuthenticateSchemeAsync()
    {
        return await GetRequestAuthScheme().ConfigureAwait(false) ?? await base.GetDefaultAuthenticateSchemeAsync().ConfigureAwait(false);
    }

    public override async Task<AuthenticationScheme?> GetDefaultChallengeSchemeAsync()
    {
        return await GetRequestAuthScheme().ConfigureAwait(false) ?? await base.GetDefaultAuthenticateSchemeAsync().ConfigureAwait(false);
    }

    public override async Task<AuthenticationScheme?> GetDefaultForbidSchemeAsync()
    {
        return await GetRequestAuthScheme().ConfigureAwait(false) ?? await base.GetDefaultAuthenticateSchemeAsync().ConfigureAwait(false);
    }

    public override async Task<AuthenticationScheme?> GetDefaultSignInSchemeAsync()
    {
        return await GetRequestAuthScheme().ConfigureAwait(false) ?? await base.GetDefaultAuthenticateSchemeAsync().ConfigureAwait(false);
    }

    public override async Task<AuthenticationScheme?> GetDefaultSignOutSchemeAsync()
    {
        return await GetRequestAuthScheme().ConfigureAwait(false) ?? await base.GetDefaultAuthenticateSchemeAsync().ConfigureAwait(false);
    }
}
