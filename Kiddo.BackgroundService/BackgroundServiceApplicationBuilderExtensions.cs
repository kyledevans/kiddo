namespace Kiddo.BackgroundService.DependencyInjection;

public static class BackgroundServiceApplicationBuilderExtensions
{
    /// <summary>
    /// Adds Swagger UI to the application.  This needs to be early in the request pipeline.  BEFORE any calls to UseRouting().
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
}
