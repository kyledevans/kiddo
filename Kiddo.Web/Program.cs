using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Serilog;
using Prometheus;
using App.Metrics;
using App.Metrics.AspNetCore;
using App.Metrics.AspNetCore.Tracking;
using App.Metrics.Reporting.InfluxDB;
using Kiddo.DAL;
using Kiddo.Clients.BackgroundServiceClient;
using Kiddo.Web.Implementations;
using Kiddo.Web.Security;
using Kiddo.Web.Mappers;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Graph.ExternalConnectors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;

MetricsFrameworkType metricsFramework = MetricsFrameworkType.None;

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
    if (metricsFramework == MetricsFrameworkType.PrometheusNet)
    {
        // prometheus-net
        healthChecksBuilder.ForwardToPrometheus();
    }
    else if (metricsFramework == MetricsFrameworkType.AppMetrics)
    {
        // App.Metrics
        // TODO: This is using a reporter designed against InfluxDB v1.  There is a new version that is about
        // to be released (as of 2022-01-08) that supports the latest version of InfluxDb.  Once that becomes
        // available this code should be swapped out.
        // 
        // Also I'm not sure if App.Metrics is actually pulling *any* settings from appsettings.json.  It's
        // a bit unclear from the documentation and I wasn't able to get InfluxDb specific configuration to
        // pull from there.  Probably will require looking into the App.Metrics code a bit to figure out how
        // this is supposed to be accomplished.
        builder.Host.ConfigureMetricsWithDefaults(config => {
            config.Report.ToInfluxDb(influx => {
                influx.InfluxDb.Database = "appmetrics";
                influx.InfluxDb.UserName = "kiddo";
                influx.InfluxDb.Password = "secure_password";
                influx.InfluxDb.RetentionPolicy = "kiddo";
                influx.InfluxDb.BaseUri = new("http://localhost:8086");
                influx.InfluxDb.CreateDataBaseIfNotExists = true;
            });
        }).UseMetrics();
        builder.Services.AddAppMetricsHealthPublishing();
        builder.Services.AddAppMetricsCollectors();
    }

    // Add implementations for backend abstractions
    builder.Services.AddScoped<Kiddo.Web.Abstractions.ICurrentUserProvider, Kiddo.Web.Implementations.CurrentUserProvider>();
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

    if (!app.Environment.IsDevelopment())
    {
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        //app.UseHsts();
    }
    else if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    if (app.Environment.IsDevelopment())
    {
        //app.UseHttpsRedirection();
    }

    app.UseStaticFiles();
    app.UseRouting();

    if (metricsFramework == MetricsFrameworkType.PrometheusNet)
    {
        app.UseHttpMetrics();
    }

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

        if (metricsFramework == MetricsFrameworkType.PrometheusNet)
        {
            endpoints.MapMetrics();
        }
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

enum MetricsFrameworkType
{
    /// <summary>
    /// No application metrics will be collected or reported.
    /// </summary>
    None = 0,

    /// <summary>
    /// prometheus-net framework: https://github.com/prometheus-net/prometheus-net
    /// </summary>
    PrometheusNet = 1,

    /// <summary>
    /// App.Metrics framework: https://github.com/AppMetrics/AppMetrics
    /// </summary>
    AppMetrics = 2
}
