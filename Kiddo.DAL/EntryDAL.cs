namespace Kiddo.DAL;

using Kiddo.Database.Models;

public class EntryDAL
{
    private DAL.KiddoDbContextExtended DbContext { get; set; }

    public EntryDAL(DAL.KiddoDbContextExtended dbContext)
    {
        this.DbContext = dbContext;
    }

    public async Task<Entry> GetEntry(int entryId)
    {
        return (await GetEntries(new() { entryId }).ConfigureAwait(false)).First();
    }

    public async Task<List<Entry>> GetEntries(List<int> entryIds)
    {
        return await (
            from e in DbContext.Entries
            where entryIds.Contains(e.EntryId)
            orderby e.DateAddedUtc, e.EntryId
            select e).ToListAsync().ConfigureAwait(false);
    }

    public async Task<List<Entry>> GetEntriesByAccounts(List<int> accountIds)
    {
        return await (
            from e in DbContext.Entries
            where accountIds.Contains(e.AccountId)
            orderby e.DateAddedUtc, e.EntryId
            select e).ToListAsync().ConfigureAwait(false);
    }

    public async Task InsertEntry(Entry newEntry)
    {
        await DbContext.Entries.AddAsync(newEntry).ConfigureAwait(false);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task DeleteEntries(List<Entry> deleteEntries)
    {
        DbContext.Entries.RemoveRange(deleteEntries);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }
}
