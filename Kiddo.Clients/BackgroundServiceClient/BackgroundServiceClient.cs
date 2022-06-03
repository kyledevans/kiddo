namespace Kiddo.Clients.BackgroundServiceClient;

using System.Net.Http.Json;
using Kiddo.BackgroundServiceContract.Service;

public class BackgroundServiceClient : IBackgroundServiceClient
{
    private HttpClient Http { get; set; }

    public BackgroundServiceClient(HttpClient http)
    {
        Http = http;
    }

    public async Task<ServiceInfo> GetServiceInfo()
    {
        ServiceInfo? result = await Http.GetFromJsonAsync<ServiceInfo>("/Service/GetServiceInfo").ConfigureAwait(false);
        if (result == null) throw new NullReferenceException(nameof(result));
        return result;
    }

    public async Task<Guid> CreateSampleInit()
    {
        Guid jobId = await (await Http.PostAsJsonAsync("/Service/CreateSampleInit", "").ConfigureAwait(false)).Content.ReadFromJsonAsync<Guid>().ConfigureAwait(false);
        return jobId;
    }
}
