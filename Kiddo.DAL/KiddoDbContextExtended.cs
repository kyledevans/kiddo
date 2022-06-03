namespace Kiddo.DAL;

using Kiddo.Database;
using Kiddo.DAL.QueryModels;

/// <summary>
/// Extends the EF database model with things like raw SQL query bindings.  Anything that doesn't have an impact on the actual database schema or core seed data.
/// </summary>
public class KiddoDbContextExtended : KiddoDbContext
{
    public KiddoDbContextExtended()
    {
    }

    public KiddoDbContextExtended(DbContextOptions<KiddoDbContextExtended> options)
        : base(options)
    {
    }

    /* Raw SQL query DTO bindings. */

#nullable disable
    public DbSet<AccountCurrencySummary> AccountCurrencySummaries { get; set; }
#nullable restore

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Indicate that raw SQL queries do NOT have a key, this basically tells EF not to generate any schema for these data structures.
        modelBuilder.Entity<AccountCurrencySummary>(acs => {
            acs.HasNoKey();
        });
    }
}
