namespace Kiddo.Web.Models;

using AutoMapper;

public class EntryModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.EntryDAL EntryDB { get; set; }
    private IMapper Mapper { get; set; }
    private Abstractions.ICurrentUserProvider CurrentUser { get; set; }

    public EntryModel(DAL.KiddoDAL db, DAL.EntryDAL entryDB, IMapper mapper, Abstractions.ICurrentUserProvider currentUser)
    {
        DB = db;
        EntryDB = entryDB;
        Mapper = mapper;
        CurrentUser = currentUser;
    }

    public async Task<WebContract.Entry.Entry> GetEntry(int entryId)
    {
        Database.Models.Entry dbEntry = await EntryDB.GetEntry(entryId).ConfigureAwait(false);
        WebContract.Entry.Entry retval = Mapper.Map<Database.Models.Entry, WebContract.Entry.Entry>(dbEntry);
        return retval;
    }

    public async Task<WebContract.Entry.Entry> CreateEntry(WebContract.Entry.Entry newEntry)
    {
        Guid userId = await CurrentUser.GetUserIdRequired().ConfigureAwait(false);
        Database.Models.Entry dbEntry = Mapper.Map<WebContract.Entry.Entry, Database.Models.Entry>(newEntry);
        dbEntry.DateAddedUtc = DateTime.UtcNow;
        dbEntry.UserId = userId;
        await EntryDB.InsertEntry(dbEntry).ConfigureAwait(false);
        WebContract.Entry.Entry retval = Mapper.Map<Database.Models.Entry, WebContract.Entry.Entry>(dbEntry);
        return retval;
    }

    public async Task<WebContract.Entry.Entry> UpdateEntry(WebContract.Entry.Entry update)
    {
        Database.Models.Entry dbEntry = await EntryDB.GetEntry(update.EntryId).ConfigureAwait(false);
        Mapper.Map(update, dbEntry);
        WebContract.Entry.Entry retval = Mapper.Map<Database.Models.Entry, WebContract.Entry.Entry>(dbEntry);
        return retval;
    }

    public async Task DeleteEntries(List<int> entryIds)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        List<Database.Models.Entry> dbEntries = await EntryDB.GetEntries(entryIds).ConfigureAwait(false);
        await EntryDB.DeleteEntries(dbEntries).ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);
    }
}
