namespace Kiddo.Utility.SerialDispatchService;

/// <summary>
/// Provides an interface to the serial dispatch service.  This allows adding jobs to the queue and is also used internally to dequeue jobs.
/// </summary>
public interface IDispatchQueue
{
    // TODO: This interface combines the API surface for both job consumers and producers.  Ideally the 2 use cases should be isolated from each other.

    /// <summary>
    /// Queue a job on the background service with additional configuration data.
    /// </summary>
    /// <typeparam name="T">Job to execute.</typeparam>
    /// <typeparam name="D">Additional configuration data for the job.</typeparam>
    /// <param name="jobName">Name of the job.</param>
    /// <param name="data">Additional configuration data for the job.</param>
    /// <returns>Id for the job.</returns>
    Guid Enqueue<T, D>(string jobName, D data) where T : IJob;

    /// <summary>
    /// Queue a job on the background service.
    /// </summary>
    /// <typeparam name="T">Job to execute.</typeparam>
    /// <param name="jobName">Name of the job.</param>
    /// <returns>Id for the job.</returns>
    Guid Enqueue<T>(string jobName) where T : IJob;

    /// <summary>
    /// Remove the next item from the queue.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    IAsyncEnumerable<JobContainer> DequeueAllAsync(CancellationToken cancellationToken);
}
