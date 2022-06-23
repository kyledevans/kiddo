namespace Kiddo.Utility.SerialDispatchService;

public class SerialDispatchServiceOptions
{
    /// <summary>
    /// Required.  Cannot be null, empty, or whitespace.
    /// </summary>
    public string ServiceName { get; set; } = String.Empty;

    /// <summary>
    /// Maximum number of jobs that can be queued.  Defaults to 1000.
    /// </summary>
    public int MaxQueueLength { get; set; } = 1000;
}
