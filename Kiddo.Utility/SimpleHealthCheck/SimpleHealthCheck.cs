namespace Kiddo.Utility.SimpleHealthCheck;

using Microsoft.Extensions.Diagnostics.HealthChecks;

public abstract class SimpleHealthCheck : IHealthCheck
{
    private readonly object statusLock = new();
    private volatile HealthStatus _status;
    private volatile string? _statusMessage;
    private HealthStatus Status { get => _status; set => _status = value; }
    private string? StatusMessage { get => _statusMessage; set => _statusMessage = value; }

    public SimpleHealthCheck()
    {
        Status = HealthStatus.Degraded;
        StatusMessage = null;
    }

    public void SetHealth(HealthStatus newStatus, string? newStatusMessage)
    {
        lock (statusLock)
        {
            Status = newStatus;
            StatusMessage = newStatusMessage;
        }
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        HealthCheckResult result;

        lock (statusLock)
        {
            result = new(Status, StatusMessage);
        }

        return Task.FromResult(result);
    }
}