namespace Kiddo.Utility.SerialDispatchService;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

public static class ExtensionMethods
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

    public static IHealthChecksBuilder AddSerialDispatchServiceHealthChecks(this IHealthChecksBuilder builder)
    {
        builder.Services.AddSingleton<SerialDispatchServiceHealthCheckLiveness>();
        builder.Services.AddSingleton<SerialDispatchServiceHealthCheckReadiness>();
        builder.Services.AddSingleton<SerialDispatchServiceHealthCheckStartup>();
        builder
            .AddCheck<SerialDispatchServiceHealthCheckLiveness>($"{nameof(SerialDispatchService)}.liveness", HealthStatus.Unhealthy, new string[] { "liveness", $"{nameof(SerialDispatchService)}" })
            .AddCheck<SerialDispatchServiceHealthCheckReadiness>($"{nameof(SerialDispatchService)}.readiness", HealthStatus.Unhealthy, new string[] { "readiness", $"{nameof(SerialDispatchService)}" })
            .AddCheck<SerialDispatchServiceHealthCheckStartup>($"{nameof(SerialDispatchService)}.startup", HealthStatus.Unhealthy, new string[] { "startup", $"{nameof(SerialDispatchService)}" });

        return builder;
    }
}
