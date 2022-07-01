namespace Kiddo.Web.Security;

using Kiddo.Web.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

public class AuthenticationMethodEnablementMiddleware : IMiddleware
{
    IOptionsMonitor<SpaOptions> SpaOptionsMonitor { get; set; }

    public AuthenticationMethodEnablementMiddleware(IOptionsMonitor<SpaOptions> spaOptionsMonitor)
    {
        SpaOptionsMonitor = spaOptionsMonitor;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        IReadOnlyList<AuthenticationMethodEnabledAttribute>? authMethodAttrs = context.GetEndpoint()?.Metadata.GetOrderedMetadata<AuthenticationMethodEnabledAttribute>();

        if (authMethodAttrs == null || authMethodAttrs.Count == 0)
            await next(context).ConfigureAwait(false);
        else
        {
            SpaOptions spaOptions = SpaOptionsMonitor.CurrentValue;
            foreach (AuthenticationMethodEnabledAttribute authMethodAttr in authMethodAttrs)
            {
                if (!spaOptions.AuthMethods.Contains(authMethodAttr.AuthenticationMethod))
                {
                    context.Response.Clear();
                    context.Response.ContentType = System.Net.Mime.MediaTypeNames.Text.Plain;
                    context.Response.StatusCode = StatusCodes.Status409Conflict;
                    ProblemDetails details = new() {
                        Type = WebContract.ProblemDetailTypes.AuthenticationMethodNotEnabled
                    };
                    await context.Response.WriteAsJsonAsync(details, null, "application/problem+json").ConfigureAwait(false);
                    await context.Response.CompleteAsync().ConfigureAwait(false);
                    return;
                }
            }

            await next(context).ConfigureAwait(false);
        }
    }
}
