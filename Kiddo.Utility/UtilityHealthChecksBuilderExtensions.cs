namespace Kiddo.Utility.DependencyInjection;

using Kiddo.Utility.SerialDispatchService;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

public static class UtilityHealthChecksBuilderExtensions
{
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
