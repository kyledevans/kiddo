namespace Kiddo.Utility.SerialDispatchService;

public class SerialDispatchServiceOptions
{
    /// <summary>
    /// Required.  Cannot be null, empty, or whitespace.
    /// </summary>
    public string ServiceName { get; set; }

    /// <summary>
    /// Maximum number of jobs that can be queued.  Defaults to 1000.
    /// </summary>
    public int MaxQueueLength { get; set; }

    public SerialDispatchServiceOptions(string serviceName)
    {
        ServiceName = serviceName;
        MaxQueueLength = 1000;
    }
}
