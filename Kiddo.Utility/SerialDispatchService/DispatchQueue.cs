namespace Kiddo.Utility.SerialDispatchService;

using System.Threading.Channels;

public class DispatchQueue : IDispatchQueue
{
    private Channel<JobContainer> InternalQueue { get; set; }

    public DispatchQueue(int maxQueueLength)
    {
        BoundedChannelOptions options = new(maxQueueLength);
        options.SingleReader = true;
        options.SingleWriter = false;

        InternalQueue = Channel.CreateBounded<JobContainer>(options);
    }

    public Guid Enqueue<T, D>(string jobName, D data) where T : IJob
    {
        Guid jobId = Guid.NewGuid();

        bool success = InternalQueue.Writer.TryWrite(new(jobId, jobName, typeof(T), data));

        if (!success)
        {
            throw new Exception($"Unable to enqueue job \"{jobName}\" because TryWrite() failed.");
        }

        return jobId;
    }

    public Guid Enqueue<T>(string jobName) where T : IJob
    {
        Guid jobId = Guid.NewGuid();

        bool success = InternalQueue.Writer.TryWrite(new(jobId, jobName, typeof(T), null));

        if (!success)
        {
            throw new Exception($"Unable to enqueue job \"{jobName}\" because TryWrite() failed.");
        }

        return jobId;
    }

    public IAsyncEnumerable<JobContainer> DequeueAllAsync(CancellationToken cancellationToken)
    {
        return InternalQueue.Reader.ReadAllAsync(cancellationToken);
    }
}
