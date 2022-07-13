namespace Kiddo.Web;

using Kiddo.Web.Security;

public static class WebApplicationBuilderExtensions
{
    /// <summary>
    /// Adds Swagger UI to the application.  This needs to be early in the request pipeline.  BEFORE any calls to UseStaticFiles().
    /// </summary>
    /// <param name="app"></param>
    /// <param name="environment"></param>
    /// <returns></returns>
    public static IApplicationBuilder UseCustomSwagger(this IApplicationBuilder app, IWebHostEnvironment environment)
    {
        if (environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        return app;
    }

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
        app.UseMiddleware<EmailConfirmationRequiredMiddleware>();
        return app;
    }
}
