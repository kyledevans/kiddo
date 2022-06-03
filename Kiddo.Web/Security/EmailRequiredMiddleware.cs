namespace Kiddo.Web.Security;

using Kiddo.Web.Abstractions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

public class EmailRequiredMiddleware
{
    private RequestDelegate Next { get; set; }

    public EmailRequiredMiddleware(RequestDelegate next)
    {
        Next = next;
    }

    public async Task InvokeAsync(HttpContext context, DAL.UserDAL userDB, ICurrentUserProvider currentUser, IOptionsMonitor<Implementations.SpaOptions> spaOptionsMonitor)
    {
        // Don't need to perform any processing if the system is not configured to require confirmed email addresses.
        if (!spaOptionsMonitor.CurrentValue.IsEmailConfirmationRequired)
        {
            await Next(context).ConfigureAwait(false);
            return;
        }

        IReadOnlyList<EmailRequiredAttribute>? emailRequiredAttrs = context.GetEndpoint()?.Metadata.GetOrderedMetadata<EmailRequiredAttribute>();

        if (emailRequiredAttrs == null || emailRequiredAttrs.Count == 0)
        {
            await Next(context).ConfigureAwait(false);
            return;
        }
        else
        {
            Guid? userId = await currentUser.GetUserId().ConfigureAwait(false);

            if (userId != null)
            {
                // User is registered.  Make sure they are confirmed.
                // Note: This is intentionally ignoring the case where the user is not registered at all.  This is to avoid scope growth
                // where more and more corner cases are handled in this middleware.  Those other cases need to be handled by other middleware
                // and authorization policies.
                Database.Models.User dbUser = await userDB.GetUser((Guid)userId).ConfigureAwait(false);
                if (!dbUser.EmailConfirmed)
                {
                    context.Response.Clear();
                    context.Response.ContentType = System.Net.Mime.MediaTypeNames.Text.Plain;
                    context.Response.StatusCode = StatusCodes.Status409Conflict;
                    ProblemDetails details = new() {
                        Type = WebContract.ProblemDetailTypes.EmailNotConfirmed
                    };
                    await context.Response.WriteAsJsonAsync(details, null, "application/problem+json").ConfigureAwait(false);
                    await context.Response.CompleteAsync().ConfigureAwait(false);
                    return;
                }
                else
                {
                    await Next(context).ConfigureAwait(false);
                    return;
                }
            }
        }
    }
}
