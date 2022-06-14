using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace Kiddo.BackgroundService.DependencyInjection;

public static class BackgroundServiceServiceCollectionExtensions
{
    public static IServiceCollection AddCustomSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(config => {
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

        return services;
    }

    public static IServiceCollection AddCustomModels(this IServiceCollection services)
    {
        services.AddScoped<Models.ServiceModel>();

        return services;
    }

    public static IServiceCollection AddCustomUserManagement(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<IdentityOptions>()
            .Configure(options => {
                options.User.RequireUniqueEmail = true; // Use email addresses as the username.
            });

        // Add ASP.Net Core Identity.
        services.AddIdentityCore<Kiddo.Database.Models.User>()
            //.AddSignInManager<SignInManager<Kiddo.Database.Models.User>>()
            .AddRoles<Kiddo.Database.Models.Role>()
            .AddEntityFrameworkStores<Kiddo.DAL.KiddoDbContextExtended>()
            .AddDefaultTokenProviders();

        // Need to add authentication even though this background service doesn't actually authenticate users.  Because the Identity
        // functionality (such as UserManager) requires some additional services that are provided by AddAuthentication().
        services.AddAuthentication();

        return services;
    }
}
