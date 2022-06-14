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
}
