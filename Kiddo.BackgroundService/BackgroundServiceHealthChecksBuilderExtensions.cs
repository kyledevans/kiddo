namespace Kiddo.BackgroundService.DependencyInjection;

using Kiddo.DAL;

public static class BackgroundServiceHealthChecksBuilderExtensions
{
    public static IHealthChecksBuilder AddCustomDbContextChecks(this IHealthChecksBuilder builder)
    {
        builder.AddDbContextCheck<KiddoDbContextExtended>("kiddodb", Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded, new string[] { "readiness" });
        return builder;
    }
}
