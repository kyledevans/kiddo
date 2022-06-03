namespace Kiddo.Web.Security;

public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Add middleware that will block access to endpoints that require a particular authentication method
    /// to be enabled in appsettings.json.  This needs to be placed in the middleware pipeline just BEFORE
    /// UseAuthentication().
    /// 
    /// See: <seealso cref="AuthenticationMethodEnabledAttribute"/>
    /// </summary>
    /// <param name="app"></param>
    /// <returns></returns>
    public static IApplicationBuilder UseAuthenticationMethodEnablementMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<AuthenticationMethodEnablementMiddleware>();
        return app;
    }

    /// <summary>
    /// Add middleware that will block access to the system based on whether the user account has a confirmed
    /// email address.  This needs to be placed in the middleware pipeline just AFTER UseAuthorization().
    /// </summary>
    /// <param name="app"></param>
    /// <returns></returns>
    public static IApplicationBuilder UseEmailRequiredMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<EmailRequiredMiddleware>();
        return app;
    }
}
