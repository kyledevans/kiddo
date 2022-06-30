using Azure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using Kiddo.Web.Configuration;

namespace Kiddo.Web.Security.Selector;

/// <summary>
/// Inherits from the ASP built in type <seealso cref="JwtBearerHandler"/>.  This simply enforces whether password authentication is enabled in appsettings.json and then defers to the base type for actual processing.
/// </summary>
public class SchemeEnabledJwtBearerHandler : JwtBearerHandler
{
    private IOptionsMonitor<SpaOptions> SpaOptionsMonitor { get; set; }
    private bool IsAuthenticationMethodDisabledError { get; set; }

    public SchemeEnabledJwtBearerHandler(IOptionsMonitor<SpaOptions> spaOptionsMonitor, IOptionsMonitor<JwtBearerOptions> optionsMonitor, ILoggerFactory loggerFactory, UrlEncoder urlEncoder, ISystemClock systemClock) :
        base(optionsMonitor, loggerFactory, urlEncoder, systemClock)
    {
        SpaOptionsMonitor = spaOptionsMonitor;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        SpaOptions spaOptions = SpaOptionsMonitor.CurrentValue;

        AuthenticateResult result;
        WebContract.AuthenticationMethodType? authMethod;

        switch (Scheme.Name)
        {
            case SecurityConstants.Scheme.AspNetIdentity: authMethod = WebContract.AuthenticationMethodType.Password; break;
            case SecurityConstants.Scheme.AzureAd: authMethod = WebContract.AuthenticationMethodType.AzureAd; break;
            case SecurityConstants.Scheme.Selector: authMethod = null; break;
            default: throw new Exception($"Cannot determine if authentication scheme is enabled because it is unknown: {Scheme.Name}.");
        }

        if (authMethod == null)
        {
            throw new Exception($"Cannot authenticate against a null scheme.");
        }
        else if (spaOptions.AuthMethods.Contains((WebContract.AuthenticationMethodType)authMethod))
        {
            result = await base.HandleAuthenticateAsync().ConfigureAwait(false);
        }
        else
        {
            IsAuthenticationMethodDisabledError = true;
            result = AuthenticateResult.Fail(WebContract.ProblemDetailTypes.AuthenticationMethodNotEnabled);
        }

        return result;
    }

    protected override async Task<Task> HandleChallengeAsync(AuthenticationProperties properties)
    {
        if (IsAuthenticationMethodDisabledError)
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            ProblemDetails details = new() {
                Type = WebContract.ProblemDetailTypes.AuthenticationMethodNotEnabled
            };
            await Response.WriteAsJsonAsync(details, null, "application/problem+json").ConfigureAwait(false);
            await Response.CompleteAsync().ConfigureAwait(false);
            return Task.CompletedTask;
        }
        else
        {
            return base.HandleChallengeAsync(properties);
        }
    }
}
