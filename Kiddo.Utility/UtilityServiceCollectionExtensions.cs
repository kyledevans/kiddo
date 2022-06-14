namespace Kiddo.Utility.DependencyInjection;

using Microsoft.Extensions.DependencyInjection;
using Kiddo.Utility.SerialDispatchService;

public static class UtilityServiceCollectionExtensions
{
    /// <summary>
    /// Add a serial dispatch queue background service.  To write jobs to the queue use the <see cref="IDispatchQueue"/> interface.
    /// </summary>
    /// <param name="services"></param>
    /// <param name="serviceName"></param>
    /// <param name="configurationFunc"></param>
    /// <exception cref="Exception"></exception>
    public static void AddSerialDispatchService(this IServiceCollection services, string serviceName, Action<SerialDispatchServiceOptions>? configurationFunc = null)
    {
        SerialDispatchServiceOptions options = new(serviceName);

        configurationFunc?.Invoke(options);

        DispatchQueue queue = new(options.MaxQueueLength);

        services.AddSingleton<IDispatchQueue>(queue);
        services.AddHostedService<SerialDispatchService>((serv) => {
            SerialDispatchService? dispatchService = ActivatorUtilities.CreateInstance(serv, typeof(SerialDispatchService), options) as SerialDispatchService;

            if (dispatchService == null)
            {
                throw new Exception($"Unable to create a default instance of {serviceName}.");
            }
            else
            {
                return dispatchService;
            }
        });
    }
}
