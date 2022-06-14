using Serilog;
using Prometheus;
using Kiddo.Web;
using Kiddo.DAL.DependencyInjection;
using Kiddo.Clients.DependencyInjection;
using Kiddo.Web.DependencyInjection;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Kiddo.Web starting up.");

try
{
    WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

    #region Services

    // Add Serilog
    builder.Host.UseSerilog((ctx, lc) => lc
        .WriteTo.Console()
        .ReadFrom.Configuration(ctx.Configuration));

    builder.Services.AddControllers();
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddCustomSwagger();
    builder.Services.AddCustomAuthentication(builder.Configuration);
    builder.Services.AddCustomAuthorization(builder.Configuration);

    builder.Services.AddHealthChecks()
        .AddCustomDbContextChecks()
        .ForwardToPrometheus(); // Expose health check metrics to Prometheus.

    builder.Services.AddCustomSpaOptions();
    builder.Services.AddCustomSmtpOptions();
    builder.Services.AddCustomDAL(builder.Configuration);
    builder.Services.AddBackgroundServiceClient(builder.Configuration);
    builder.Services.AddCustomModels();
    builder.Services.AddCustomMappers();

    #endregion

    WebApplication app = builder.Build();

    #region Request pipeline

    app.UseSerilogRequestLogging();
    app.UseCustomSwagger(app.Environment);
    app.UseStaticFiles();
    app.UseRouting();
    app.UseHttpMetrics();
    app.UseAuthenticationMethodEnablementMiddleware();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseEmailRequiredMiddleware();
    app.MapControllers();
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapHealthChecks("/health");
        endpoints.MapHealthChecks("/health/startup", new() {
            Predicate = healthCheck => healthCheck.Tags.Contains("startup")
        });
        endpoints.MapHealthChecks("/health/liveness", new() {
            Predicate = healthCheck => healthCheck.Tags.Contains("liveness")
        });
        endpoints.MapHealthChecks("/health/readiness", new() {
            Predicate = healthCheck => healthCheck.Tags.Contains("readiness")
        });

        endpoints.MapMetrics();
    });

    app.MapFallbackToFile("index.html");

    app.Run();

    #endregion
}
catch (Exception ex)
{
    Log.Fatal(ex, "Unhandled exception.");
}
finally
{
    Log.Information("Kiddo.Web shut down complete.");
    Log.CloseAndFlush();
}
