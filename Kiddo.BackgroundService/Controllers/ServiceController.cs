namespace Kiddo.BackgroundService.Controllers;

using Microsoft.AspNetCore.Mvc;
using Kiddo.BackgroundServiceContract.Service;
using Kiddo.BackgroundService.Models;

[ApiController]
[Route("[controller]")]
public class ServiceController : ControllerBase
{
    private ServiceModel Model { get; set; }

    public ServiceController(ServiceModel model)
    {
        Model = model;
    }

    [HttpGet("GetServiceInfo")]
    public ActionResult<ServiceInfo> GetServiceInfo()
    {
        ServiceInfo retval = Model.GetServiceInfo();

        return retval;
    }

    [HttpPost("CreateSampleInit")]
    public ActionResult<Guid> CreateSampleInit()
    {
        Guid jobId = Model.CreateSampleInit();
        return jobId;
    }
}
