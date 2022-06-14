namespace Kiddo.Clients.DependencyInjection;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

public static class ClientsServiceCollectionExtensions
{
    public static void AddBackgroundServiceClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<BackgroundServiceClient.IBackgroundServiceClient, BackgroundServiceClient.BackgroundServiceClient>((services) => {
            IHttpClientFactory httpFactory = services.GetRequiredService<IHttpClientFactory>();
            HttpClient http = httpFactory.CreateClient("Kiddo.BackgroundServiceClient");
            http.BaseAddress = new(configuration.GetConnectionString("kiddoBackgroundService"));
            return new BackgroundServiceClient.BackgroundServiceClient(http);
        });
    }
}
