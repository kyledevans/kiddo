namespace Kiddo.Clients.BackgroundServiceClient;

using Kiddo.BackgroundServiceContract.Service;

public interface IBackgroundServiceClient
{
    Task<ServiceInfo> GetServiceInfo();
    Task<Guid> CreateSampleInit();
}
