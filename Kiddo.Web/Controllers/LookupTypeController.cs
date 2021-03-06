namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Mvc;
using Kiddo.WebContract.LookupType;
using Microsoft.Identity.Web.Resource;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Security.EmailConfirmationRequired]
public class LookupTypeController : ControllerBase
{
    private Models.LookupTypeModel LookupTypeModel { get; set; }

    public LookupTypeController(Models.LookupTypeModel lookupTypeModel)
    {
        LookupTypeModel = lookupTypeModel;
    }

    /// <summary>
    /// Retrieve a single LookupType and all of it's values.
    /// </summary>
    /// <param name="lookupTypeId"></param>
    /// <returns></returns>
    [HttpGet]
    [Authorize(Policy = Security.SecurityConstants.Policy.ReadOnlyUser)]
    public async Task<ActionResult<LookupType>> GetLookupType(int lookupTypeId)
    {
        LookupType type = await LookupTypeModel.GetLookupType(lookupTypeId).ConfigureAwait(false);
        return type;
    }

    [HttpPost]
    [Authorize(Policy = Security.SecurityConstants.Policy.SuperAdministrator)]
    public async Task<ActionResult<LookupType>> UpdateLookupType(LookupType lookupType)
    {
        // TODO: This needs to handle Foreign Key constraint exceptions.
        LookupType type = await LookupTypeModel.UpdateLookupType(lookupType).ConfigureAwait(false);
        return type;
    }
}
