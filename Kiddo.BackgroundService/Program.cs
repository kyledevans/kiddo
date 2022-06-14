using Serilog;
using Kiddo.DAL.DependencyInjection;
using Kiddo.Utility.DependencyInjection;
using Kiddo.BackgroundService.DependencyInjection;
using Prometheus;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

Log.Information("Kiddo.BackgroundService starting up.");

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

    builder.Services.AddHealthChecks()
        .AddCustomDbContextChecks()
        .AddSerialDispatchServiceHealthChecks()
        .ForwardToPrometheus(); // Expose health check metrics to Prometheus.;

    builder.Services.AddCustomDAL(builder.Configuration);
    builder.Services.AddSerialDispatchService("Kiddo.BackgroundService.Dispatch");
    builder.Services.AddCustomModels();
    builder.Services.AddCustomUserManagement(builder.Configuration);

    #endregion

    WebApplication app = builder.Build();

    #region Request pipeline

    app.UseSerilogRequestLogging();
    app.UseCustomSwagger(app.Environment);
    app.UseRouting();
    app.UseHttpMetrics();
    app.MapControllers();

    app.UseEndpoints(endpoints => {
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

    app.Run();

    #endregion
}
catch (Exception ex)
{
    Log.Fatal(ex, "Unhandled exception.");
}
finally
{
    Log.Information("Kiddo.BackgroundService shut down complete.");
    Log.CloseAndFlush();
}
