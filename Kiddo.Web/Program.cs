using Microsoft.AspNetCore.Authentication.JwtBearer;
using Serilog;
using Prometheus;
using Kiddo.DAL;
using Kiddo.Clients.BackgroundServiceClient;
using Kiddo.Web.Security;
using Kiddo.Web.Mappers;
using Microsoft.OpenApi.Models;
using Kiddo.Web.Configuration;

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

        config.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new()
        {
            In = ParameterLocation.Header,
            Description = "Please enter token",
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            BearerFormat = "JWT",
            Scheme = JwtBearerDefaults.AuthenticationScheme
        });
        config.AddSecurityRequirement(new()
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new()
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = JwtBearerDefaults.AuthenticationScheme
                    }
                },
                Array.Empty<string>()
            }
        });
        config.CustomSchemaIds(type => type.ToString());
    });

    builder.Services.AddCustomSecurity(builder.Configuration);

    // Add health checks
    IHealthChecksBuilder healthChecksBuilder = builder.Services.AddHealthChecks()
        .AddDbContextCheck<KiddoDbContextExtended>("kiddodb", Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded, new string[] { "readiness" });

    // Add metrics
    healthChecksBuilder.ForwardToPrometheus();

    // Add implementations for backend abstractions
    builder.Services.AddScoped<ICurrentUserProvider, CurrentUserProvider>();
    builder.Services.AddCustomSpaConfiguration(builder.Configuration);
    builder.Services.AddCustomDAL(builder.Configuration);
    builder.Services.AddBackgroundServiceClient(builder.Configuration);

    // Add models
    builder.Services.AddScoped<Kiddo.Web.Models.AppModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.AccountModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.EntryModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.LookupTypeModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.UserModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.ProfileModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.IdentityModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.AzureAdModel>();
    builder.Services.AddScoped<Kiddo.Web.Models.EmailSender>();
    builder.Services.AddScoped<Kiddo.Web.Models.Validators>();

    // Add AutoMapper converters
    builder.Services.AddCustomMappers();

    // Add SMTP configuration
    builder.Services.AddOptions<Kiddo.Web.SmtpOptions>()
        .BindConfiguration("Smtp");

    #endregion

    WebApplication app = builder.Build();

    #region Request pipeline

    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

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
