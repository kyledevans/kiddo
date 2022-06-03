namespace Kiddo.Web.Models;

using AutoMapper;
using Kiddo.Web.Mappers;

public class LookupTypeModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.LookupTypeDAL LookupTypeDB { get; set; }
    private IMapper Mapper { get; set; }

    public LookupTypeModel(DAL.KiddoDAL db, DAL.LookupTypeDAL lookupTypeDB, IMapper mapper)
    {
        DB = db;
        LookupTypeDB = lookupTypeDB;
        Mapper = mapper;
    }

    public async Task<WebContract.LookupType.LookupType> GetLookupType(int lookupTypeId)
    {
        Database.Models.LookupType dbType = await LookupTypeDB.GetLookupType(lookupTypeId).ConfigureAwait(false);
        List<Database.Models.Lookup> dbLookups = await LookupTypeDB.GetLookups(lookupTypeId).ConfigureAwait(false);

        WebContract.LookupType.LookupType retval = Mapper.DB_LookupType_Web_LookupType(dbType, dbLookups);

        return retval;
    }

    public async Task<WebContract.LookupType.LookupType> UpdateLookupType(WebContract.LookupType.LookupType update)
    {
        // Note: This is intentionally NOT updating the LookupType record itself.  Because those are currently exclusively maintained by the application
        // and are not intended to be data driven.  But the schema does allow for more data driven capability if that is a required feature.

        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        Database.Models.LookupType dbType = await LookupTypeDB.GetLookupType(update.LookupTypeId).ConfigureAwait(false);
        List<Database.Models.Lookup> dbLookups = await LookupTypeDB.GetLookups(update.LookupTypeId).ConfigureAwait(false);
        int nextFreeLookupId = await LookupTypeDB.GetFreeLookupId().ConfigureAwait(false);

        // Remove all references for Lookup records with a LookupId less than 1000 from both the list of records pulled from the database, and from
        // the list of updates provided by the caller.  Because records less than 1000 are reserved for internal use by the system, and should not
        // be modified.
        update.Lookups = update.Lookups.Where(l => l.LookupId < 0 || l.LookupId >= Constants.Lookup.InitialLookupId).ToList();
        dbLookups = dbLookups.Where(l => l.LookupId >= Constants.Lookup.InitialLookupId).ToList();

        List<Database.Models.Lookup> dbLookupsStillExist = new();   // Helps us determine which Lookup values need to be deleted.
        List<Database.Models.Lookup> dbLookupInserts = new();

        foreach ((WebContract.LookupType.Lookup lookup, int index) in update.Lookups.Select((l, i) => (lookup: l, index: i)))
        {
            Database.Models.Lookup? dbLookup = dbLookups.FirstOrDefault(l => l.LookupId == lookup.LookupId);

            if (dbLookup == null)
            {
                dbLookup = Mapper.Map<WebContract.LookupType.Lookup, Database.Models.Lookup>(lookup);
                dbLookup.LookupId = nextFreeLookupId++;
                dbLookup.LookupTypeId = update.LookupTypeId;
                dbLookup.SortOrder = index;
                dbLookupInserts.Add(dbLookup);
            }
            else
            {
                dbLookupsStillExist.Add(dbLookup);  // Mark this Lookup record to be preserved, the caller did not want it deleted.
                Mapper.Map(lookup, dbLookup);
                dbLookup.SortOrder = index;
            }
        }

        // Write changes to the database.
        await DB.SaveChanges().ConfigureAwait(false);
        await LookupTypeDB.InsertLookups(dbLookupInserts).ConfigureAwait(false);
        await LookupTypeDB.DeleteLookups(dbLookups.Except(dbLookupsStillExist).ToList()).ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);

        // Return the LookupType to the caller.
        return await GetLookupType(update.LookupTypeId).ConfigureAwait(false);
    }
}
