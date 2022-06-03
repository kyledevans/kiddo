namespace Kiddo.Clients.BackgroundServiceClient;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

public static class ExtensionMethods
{
    public static void AddBackgroundServiceClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IBackgroundServiceClient, BackgroundServiceClient>((services) => {
            IHttpClientFactory httpFactory = services.GetRequiredService<IHttpClientFactory>();
            HttpClient http = httpFactory.CreateClient("Kiddo.BackgroundServiceClient");
            http.BaseAddress = new(configuration.GetConnectionString("kiddoBackgroundService"));
            return new BackgroundServiceClient(http);
        });
    }
}
