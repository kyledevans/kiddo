namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using Kiddo.WebContract.App;

[ApiController]
[Route("api/[controller]")]
public class AppController : ControllerBase
{
    private Models.AppModel AppModel { get; set; }

    public AppController(Models.AppModel appModel)
    {
        AppModel = appModel;
    }

    [HttpGet("GetSpaConfiguration")]
    public ActionResult<SpaConfiguration> GetSpaConfiguration()
    {
        SpaConfiguration retval = AppModel.GetSpaConfiguration();
        return retval;
    }

    [HttpGet("GetApplicationInfo")]
    [RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
    public async Task<ActionResult<ApplicationInfo>> GetApplicationInfo()
    {
        ApplicationInfo retval = await AppModel.GetApplicationInfo().ConfigureAwait(false);
        return retval;
    }
}
