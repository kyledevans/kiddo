namespace Kiddo.DAL;

public class KiddoDAL
{
    private KiddoDbContextExtended DbContext { get; set; }

    public KiddoDAL(KiddoDbContextExtended dbContext)
    {
        this.DbContext = dbContext;
    }

    public async Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransaction()
    {
        // Note: Future versions of EF will allow this to use a different isolation level for the transaction.
        return await DbContext.Database.BeginTransactionAsync().ConfigureAwait(false);
    }

    public async Task SaveChanges()
    {
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }
}
