namespace Kiddo.Database;

using Kiddo.Database.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

public class KiddoDbContext : IdentityDbContext<User, Role, Guid, UserClaim, UserRole, UserLogin, RoleClaim, UserToken>
{
    public KiddoDbContext()
    {
    }

    protected KiddoDbContext(DbContextOptions options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer();
        }
    }

#nullable disable
    public virtual DbSet<Account> Accounts { get; set; }
    public virtual DbSet<Entry> Entries { get; set; }
    public virtual DbSet<Lookup> Lookups { get; set; }
    public virtual DbSet<LookupType> LookupTypes { get; set; }
#nullable restore

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Account>(a =>
        {
            a.ToTable("Account");

            a.Property(a => a.Name).HasMaxLength(4000).IsRequired();

            a.Property(a => a.NameShort).HasMaxLength(4000).IsRequired();

            a.Property(a => a.Description).HasMaxLength(4000);
        });

        modelBuilder.Entity<Entry>((e) =>
        {
            e.ToTable("Entry");

            // Set the Kind property to UTC when reading existing records from the database.
            e.Property(e => e.DateAddedUtc).HasConversion(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            e.HasOne(e => e.Account)
                .WithMany(a => a.Entries)
                .HasForeignKey(e => e.AccountId)
                .HasConstraintName("FK_Entry_Account")
                .OnDelete(DeleteBehavior.ClientSetNull);

            e.HasOne(e => e.CurrencyLookup)
                .WithMany(l => l.CurrencyEntries)
                .HasForeignKey(e => e.CurrencyLookupId)
                .HasConstraintName("FK_Entry_Lookup_Currency")
                .OnDelete(DeleteBehavior.ClientSetNull);

            e.HasOne(e => e.User)
                .WithMany(us => us.Entries)
                .HasForeignKey(e => e.UserId)
                .HasConstraintName("FK_Entry_User")
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Lookup>(l =>
        {
            l.ToTable("Lookup");

            l.Property(l => l.LookupId).ValueGeneratedNever();

            l.Property(l => l.Name).HasMaxLength(4000).IsRequired();

            l.Property(l => l.NameShort).HasMaxLength(4000).IsRequired();

            l.Property(l => l.Description).HasMaxLength(4000);

            l.HasOne(l => l.LookupType)
                .WithMany(lt => lt.Lookups)
                .HasForeignKey(l => l.LookupTypeId)
                .HasConstraintName("FK_Lookup_LookupType")
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<LookupType>(lt =>
        {
            lt.ToTable("LookupType");

            lt.Property(lt => lt.LookupTypeId).ValueGeneratedNever();

            lt.Property(lt => lt.Name).HasMaxLength(4000).IsRequired();

            lt.Property(lt => lt.Description).HasMaxLength(4000).IsRequired();
        });

        modelBuilder.Entity<User>(us =>
        {
            us.ToTable("User", "User");

            us.Property(us => us.Id).ValueGeneratedOnAdd().HasColumnName("UserId");

            us.Property(us => us.DisplayName).HasMaxLength(4000).IsRequired();

            us.Property(us => us.GivenName).HasMaxLength(4000);

            us.Property(us => us.Surname).HasMaxLength(4000);
        });

        modelBuilder.Entity<UserClaim>(usc =>
        {
            usc.ToTable("UserClaim", "User");

            usc.Property(usc => usc.Id).HasColumnName("UserClaimId");
        });

        modelBuilder.Entity<UserRole>(usr =>
        {
            usr.ToTable("UserRole", "User");
        });

        modelBuilder.Entity<UserLogin>(usl =>
        {
            usl.ToTable("UserLogin", "User");
        });

        modelBuilder.Entity<RoleClaim>(rc =>
        {
            rc.ToTable("RoleClaim", "User");

            rc.Property(rc => rc.Id).HasColumnName("RoleClaimId");
        });

        modelBuilder.Entity<UserToken>(ust =>
        {
            ust.ToTable("UserToken", "User");
        });

        modelBuilder.Entity<Role>(r =>
        {
            r.ToTable("Role", "User");

            r.Property(r => r.Id).ValueGeneratedOnAdd().HasColumnName("RoleId");
        });

        /* Seed data */
        modelBuilder.Entity<LookupType>().HasData(new LookupType[]
        {
            new() { LookupTypeId = (int)Constants.LookupTypeType.Zero, Name = "Zero", Description = "Zero", SortOrder = 0 },
            new() { LookupTypeId = (int)Constants.LookupTypeType.Currency, Name = "Currency", Description = "Currency", SortOrder = 2 },
            new() { LookupTypeId = (int)Constants.LookupTypeType.SecurityRole, Name = "Security Role", Description = "Security role", SortOrder = 1 }
        });

        modelBuilder.Entity<Lookup>().HasData(new Lookup[]
        {
            new() { LookupTypeId = 0, LookupId = (int)Constants.Lookup.Zero, Name = "Zero", NameShort = "Zero", Description = "Zero", SortOrder = 0, IsActive = false }
        });

        modelBuilder.Entity<Role>().HasData(new Role[]
        {
            new() { Id = Constants.SecurityRoleTypeDefaultId.SuperAdministrator, Name = nameof(Constants.SecurityRoleType.SuperAdministrator), NormalizedName = nameof(Constants.SecurityRoleType.SuperAdministrator).ToUpperInvariant(), ConcurrencyStamp = "initialize" },
            new() { Id = Constants.SecurityRoleTypeDefaultId.Administrator, Name = nameof(Constants.SecurityRoleType.Administrator), NormalizedName = nameof(Constants.SecurityRoleType.Administrator).ToUpperInvariant(), ConcurrencyStamp = "initialize" },
            new() { Id = Constants.SecurityRoleTypeDefaultId.User, Name = nameof(Constants.SecurityRoleType.User), NormalizedName = nameof(Constants.SecurityRoleType.User).ToUpperInvariant(), ConcurrencyStamp = "initialize" },
            new() { Id = Constants.SecurityRoleTypeDefaultId.ReadOnlyUser, Name = nameof(Constants.SecurityRoleType.ReadOnlyUser), NormalizedName = nameof(Constants.SecurityRoleType.ReadOnlyUser).ToUpperInvariant(), ConcurrencyStamp = "initialize" }
        });
    }
}
