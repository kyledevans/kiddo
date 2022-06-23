namespace Kiddo.Utility.SerialDispatchService;

using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;
using System.Threading.Channels;

public class DispatchQueue : IDispatchQueue
{
    private Channel<JobContainer>? InternalQueue { get; set; }
    private IOptionsMonitor<SerialDispatchServiceOptions> OptionsMonitor { get; set; }

    public DispatchQueue(IOptionsMonitor<SerialDispatchServiceOptions> optionsMonitor)
    {
        OptionsMonitor = optionsMonitor;
    }

    [MemberNotNull(nameof(InternalQueue))]
    private void Initialize()
    {
        if (InternalQueue != null) return;

        BoundedChannelOptions options = new(OptionsMonitor.CurrentValue.MaxQueueLength)
        {
            SingleReader = true,
            SingleWriter = false
        };

        InternalQueue = Channel.CreateBounded<JobContainer>(options);
    }

    public Guid Enqueue<T, D>(string jobName, D data) where T : IJob
    {
        Initialize();

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
        Initialize();

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
        Initialize();

        return InternalQueue.Reader.ReadAllAsync(cancellationToken);
    }
}
