namespace Kiddo.DAL;

using Kiddo.Database.Models;

public class LookupTypeDAL
{
    private KiddoDbContextExtended DbContext { get; set; }

    public LookupTypeDAL(KiddoDbContextExtended dbContext)
    {
        this.DbContext = dbContext;
    }

    public async Task<List<LookupType>> GetAllLookupTypes()
    {
        return await (
            from lt in DbContext.LookupTypes
            where lt.LookupTypeId != 0
            orderby lt.SortOrder, lt.LookupTypeId
            select lt).ToListAsync().ConfigureAwait(false);
    }

    public async Task<LookupType> GetLookupType(int lookupTypeId)
    {
        if (lookupTypeId == 0) throw new ArgumentException("Cannot be zero.", nameof(lookupTypeId));

        return await (
            from lt in DbContext.LookupTypes
            where lt.LookupTypeId == lookupTypeId
            select lt).FirstAsync().ConfigureAwait(false);
    }

    public async Task<List<Lookup>> GetLookups(int lookupTypeId)
    {
        return await (
            from l in DbContext.Lookups
            where l.LookupTypeId == lookupTypeId
            orderby l.SortOrder, l.LookupId
            select l).ToListAsync().ConfigureAwait(false);
    }

    public async Task InsertLookups(List<Lookup> inserts)
    {
        await DbContext.Lookups.AddRangeAsync(inserts).ConfigureAwait(false);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task DeleteLookups(List<Lookup> deletes)
    {
        DbContext.Lookups.RemoveRange(deletes);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task<int> GetFreeLookupId()
    {
        int? maxLookupId = await (from l in DbContext.Lookups where l.LookupId >= Constants.Lookup.InitialLookupId select (int?)l.LookupId).MaxAsync().ConfigureAwait(false);
        return maxLookupId == null ? Constants.Lookup.InitialLookupId : ((int)maxLookupId + 1);
    }
}
