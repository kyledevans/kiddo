namespace Kiddo.Web.Controllers;

using Microsoft.AspNetCore.Mvc;
using Kiddo.WebContract.Entry;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web.Resource;

[ApiController]
[Route("api/[controller]")]
[RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
[Security.EmailRequired]
public class EntryController : ControllerBase
{
    private Models.EntryModel EntryModel { get; set; }

    public EntryController(Models.EntryModel entryModel)
    {
        EntryModel = entryModel;
    }

    [HttpGet]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.ReadOnlyUser))]
    public async Task<ActionResult<Entry>> GetEntry(int entryId)
    {
        Entry entry = await EntryModel.GetEntry(entryId).ConfigureAwait(false);
        return entry;
    }

    [HttpPut]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.User))]
    public async Task<ActionResult<Entry>> CreateEntry(Entry newEntry)
    {
        Entry entry = await EntryModel.CreateEntry(newEntry).ConfigureAwait(false);
        return entry;
    }

    [HttpPost]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.User))]
    public async Task<ActionResult<Entry>> UpdateEntry(Entry updateEntry)
    {
        Entry entry = await EntryModel.UpdateEntry(updateEntry).ConfigureAwait(false);
        return entry;
    }

    [HttpPost("DeleteEntries")]
    [Authorize(Policy = nameof(Constants.SecurityRoleType.User))]
    public async Task<ActionResult> DeleteEntries(List<int> entryIds)
    {
        // TODO: This needs to handle Foreign Key exceptions.
        await EntryModel.DeleteEntries(entryIds).ConfigureAwait(false);
        return Ok();
    }
}
