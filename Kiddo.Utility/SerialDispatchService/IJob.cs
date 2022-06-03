namespace Kiddo.Utility.SerialDispatchService;

/// <summary>
/// Classes that implement this interface are executed in the serial dispatch service.
/// </summary>
public interface IJob
{
    Task Run(CancellationToken cancellationToken);
}
