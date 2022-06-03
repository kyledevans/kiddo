namespace Kiddo.Utility.SerialDispatchService;

public class JobContainer
{
    public Guid JobId { get; private set; }
    public string JobName { get; private set; }
    public Type JobType { get; set; }
    public object? Data { get; set; }

    public JobContainer(Guid jobId, string jobName, Type jobType, object? data)
    {
        JobId = jobId;
        JobName = jobName;
        JobType = jobType;
        Data = data;
    }
}
