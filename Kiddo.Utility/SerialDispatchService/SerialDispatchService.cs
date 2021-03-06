namespace Kiddo.Utility.SerialDispatchService;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

public class SerialDispatchService : BackgroundService
{
    private IDispatchQueue Queue { get; set; }
    private IServiceProvider Services { get; set; }
    private ILogger<SerialDispatchService> Logger { get; set; }
    private IOptionsMonitor<SerialDispatchServiceOptions> OptionsMonitor { get; set; }
    private SerialDispatchServiceHealthCheckLiveness? HealthCheckLiveness { get; set; }
    private SerialDispatchServiceHealthCheckReadiness? HealthCheckReadiness { get; set; }
    private SerialDispatchServiceHealthCheckStartup? HealthCheckStartup { get; set; }

    public SerialDispatchService(IDispatchQueue queue, ILogger<SerialDispatchService> logger, IServiceProvider services, IOptionsMonitor<SerialDispatchServiceOptions> options)
    {
        Queue = queue;
        Logger = logger;
        Services = services;
        OptionsMonitor = options;

        // Health checks are optional
        HealthCheckLiveness = services.GetService<SerialDispatchServiceHealthCheckLiveness>();
        HealthCheckReadiness = services.GetService<SerialDispatchServiceHealthCheckReadiness>();
        HealthCheckStartup = services.GetService<SerialDispatchServiceHealthCheckStartup>();

        HealthCheckStartup?.SetHealth(HealthStatus.Degraded, "Starting");
        HealthCheckReadiness?.SetHealth(HealthStatus.Degraded, "Starting");
        HealthCheckLiveness?.SetHealth(HealthStatus.Degraded, "Starting");
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        SerialDispatchServiceOptions options = OptionsMonitor.CurrentValue;

        if (String.IsNullOrWhiteSpace(options.ServiceName))
        {
            throw new Exception($"{nameof(SerialDispatchServiceOptions.ServiceName)} cannot be null, empty, or whitespace.");
        }

        Logger.LogInformation("SerialDispatchService: \"{ServiceName}\" is starting.", options.ServiceName);

        HealthCheckStartup?.SetHealth(HealthStatus.Healthy, null);
        HealthCheckReadiness?.SetHealth(HealthStatus.Healthy, null);
        HealthCheckLiveness?.SetHealth(HealthStatus.Healthy, null);
        Logger.LogInformation("SerialDispatchService: \"{ServiceName}\" is started.", options.ServiceName);

        await foreach (JobContainer container in Queue.DequeueAllAsync(cancellationToken))
        {
            using (IServiceScope scope = Services.CreateScope())
            using (CancellationTokenSource jobCancelToken = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken))
            using (Logger.BeginScope("SerialDispatchService: {JobName} {JobId}.", container.JobName, container.JobId))
            {
                try
                {
                    Logger.LogInformation("SerialDispatchService: Starting queued job {JobName} {JobId}.", container.JobName, container.JobId);
                    IJob? job;

                    if (container.Data == null)
                    {
                        job = ActivatorUtilities.CreateInstance(scope.ServiceProvider, container.JobType) as IJob;
                    }
                    else
                    {
                        job = ActivatorUtilities.CreateInstance(scope.ServiceProvider, container.JobType, container.Data) as IJob;
                    }

                    if (job == null) throw new NullReferenceException($"SerialDispatchService: Unable to instantiate job \"{container.JobName}\".");

                    await job.Run(jobCancelToken.Token).ConfigureAwait(false);

                    Logger.LogInformation("SerialDispatchService: Finished queued job {JobName} {JobId}.", container.JobName, container.JobId);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "SerialDispatchService: Unhandled exception for job {JobName} {JobId}.", container.JobName, container.JobId);
                }
            }
        }

        Logger.LogInformation("SerialDispatchService: {ServiceName} is stopping.", options.ServiceName);

        HealthCheckReadiness?.SetHealth(HealthStatus.Unhealthy, "Stopped");
        HealthCheckLiveness?.SetHealth(HealthStatus.Unhealthy, "Stopped");

        Logger.LogInformation("SerialDispatchService: {ServiceName} is stopped.", options.ServiceName);
    }
}
