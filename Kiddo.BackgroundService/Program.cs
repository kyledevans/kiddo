using Serilog;
using Kiddo.DAL;
using Kiddo.Utility.SerialDispatchService;

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

    // Add ASP features
    builder.Services.AddControllers();
    builder.Services.AddHttpContextAccessor();

    // Add Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(config => {
        /* Note: The following lines require that the *.csproj file be modified to have the following 2 settings:
           <GenerateDocumentationFile>true</GenerateDocumentationFile>
           <NoWarn>$(NoWarn);1591</NoWarn>
         * 
         * These need to be placed within the <PropertyGroup> node (it's near the top).
         */

        // Set the comments path for the Swagger JSON and UI.
        string xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        string xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        config.IncludeXmlComments(xmlPath);
    });

    // Add health checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<KiddoDbContextExtended>("kiddodb", Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded, new string[] { "readiness" })
        .AddSerialDispatchServiceHealthChecks();

    // Add implementations for backend abstractions
    builder.Services.AddCustomDAL(builder.Configuration);
    builder.Services.AddSerialDispatchService("Kiddo.BackgroundService.Dispatch");

    // Add models
    builder.Services.AddScoped<Kiddo.BackgroundService.Models.ServiceModel>();

    #endregion

    WebApplication app = builder.Build();

    #region Request pipeline

    app.UseSerilogRequestLogging();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseRouting();
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
