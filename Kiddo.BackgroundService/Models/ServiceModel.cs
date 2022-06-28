namespace Kiddo.BackgroundService.Models;

using Kiddo.BackgroundServiceContract.Service;
using Kiddo.Utility.SerialDispatchService;
using Microsoft.AspNetCore.Identity;
using System.Reflection;
using System.Threading;

public class ServiceModel
{
    private IDispatchQueue DispatchQueue { get; set; }

    public ServiceModel(IDispatchQueue dispatchQueue)
    {
        DispatchQueue = dispatchQueue;
    }

    public ServiceInfo GetServiceInfo()
    {
        ServiceInfo retval = new();

        Assembly? assembly = Assembly.GetEntryAssembly();
        if (assembly != null)
        {
            AssemblyFileVersionAttribute? attr = assembly.GetCustomAttribute<AssemblyFileVersionAttribute>();
            if (attr != null) retval.Version = attr.Version;
        }

        return retval;
    }

    public Guid CreateSampleInit()
    {
        Guid jobId = DispatchQueue.Enqueue<CreateSampleInitJob, CreateSampleInitJobOptions>("CreateSampleInit", new() { SampleSize = SampleSizeType.Large });
        return jobId;
    }

    public enum SampleSizeType
    {
        Small = 0,
        Medium = 1,
        Large = 2,
        Extreme = 3
    }

    public class CreateSampleInitJobOptions
    {
        public SampleSizeType SampleSize { get; set; } = SampleSizeType.Small;
    }

    public class CreateSampleInitJob : IJob
    {
        private DAL.KiddoDAL DB { get; set; }
        private DAL.UserDAL UserDB { get; set; }
        private DAL.AccountDAL AccountDB { get; set; }
        private DAL.LookupTypeDAL LookupTypeDB { get; set; }
        private DAL.EntryDAL EntryDB { get; set; }
        private CreateSampleInitJobOptions Options { get; set; }
        private UserManager<Database.Models.User> UserManager { get; set; }

        public CreateSampleInitJob(DAL.KiddoDAL db, DAL.UserDAL userDB, DAL.AccountDAL accountDB, DAL.LookupTypeDAL lookupTypeDB, DAL.EntryDAL entryDB, CreateSampleInitJobOptions options, UserManager<Database.Models.User> userManager)
        {
            DB = db;
            UserDB = userDB;
            AccountDB = accountDB;
            LookupTypeDB = lookupTypeDB;
            EntryDB = entryDB;
            Options = options;
            UserManager = userManager;
        }

        public async Task Run(CancellationToken cancellationToken)
        {
            using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

            (int users, int accounts, int currencies, int maxEntriesPerAccount) counts;

            if (Options.SampleSize == SampleSizeType.Small) counts = (users: 2, accounts: 2, currencies: 2, maxEntriesPerAccount: 5);
            else if (Options.SampleSize == SampleSizeType.Medium) counts = (users: 100, accounts: 20, currencies: 5, maxEntriesPerAccount: 5);
            else if (Options.SampleSize == SampleSizeType.Large) counts = (users: 1000, accounts: 1000, currencies: 100, maxEntriesPerAccount: 50);
            else if (Options.SampleSize == SampleSizeType.Extreme) counts = (users: 100000, accounts: 100000, currencies: 100000, maxEntriesPerAccount: 500);
            else throw new Exception("Unknown number of entries to create.");

            // Get the next free LookupId.
            int firstFreeLookupId = await LookupTypeDB.GetFreeLookupId().ConfigureAwait(false);

            // Users
            List<Database.Models.User> dbUsers = new();
            for (int i = 0; i < counts.users; i++)
            {
                dbUsers.Add(new() { DisplayName = $"Test User {i + 1}", GivenName = $"Test{i + 1}", Surname = $"Test{i + 1}", UserName = $"test.user.{i + 1}@test.com", Email = $"test.user.{i + 1}@test.com" });
            }

            // Accounts
            List<Database.Models.Account> dbAccounts = new();
            for (int i = 0; i < counts.accounts; i++)
            {
                dbAccounts.Add(new() { Name = $"Child {i + 1}", NameShort = $"C{i + 1}" });
            }

            // Currencies
            List<Database.Models.Lookup> dbLookups = new();
            for (int i = 0; i < counts.currencies; i++)
            {
                dbLookups.Add(new() { LookupId = firstFreeLookupId + i, Name = $"Token {i + 1}", NameShort = $"T{i + 1}", IsActive = true, LookupTypeId = (int)Constants.LookupTypeType.Currency });
            }

            // Write the changes to the database
            foreach (Database.Models.User dbUser in dbUsers)
            {
                await UserManager.CreateAsync(dbUser).ConfigureAwait(false);
            }

            foreach (Database.Models.Account dbAccount in dbAccounts)
            {
                await AccountDB.InsertAccount(dbAccount).ConfigureAwait(false);
            }

            await LookupTypeDB.InsertLookups(dbLookups).ConfigureAwait(false);

            // Entries
            List<Database.Models.Entry> dbEntries = new();
            Random rng = new Random(1); // Seed to 1 so if the inputs are identical, the RNG will be identical.
            for (int accountIndex = 0; accountIndex < counts.accounts; accountIndex++)
            {
                for (int entryIndex = 0; entryIndex < counts.maxEntriesPerAccount; entryIndex++)
                {
                    int entryValue = rng.Next(2);

                    if (entryValue == 0) continue;

                    Database.Models.Account dbAccount = dbAccounts[accountIndex];
                    Database.Models.User dbUser = dbUsers[rng.Next(counts.users)];
                    Database.Models.Lookup dbLookup = dbLookups[rng.Next(counts.currencies)];

                    dbEntries.Add(new() { AccountId = dbAccount.AccountId, UserId = dbUser.Id, CurrencyLookupId = dbLookup.LookupId, Value = 1, DateAddedUtc = DateTime.UtcNow });
                }
            }

            foreach (Database.Models.Entry dbEntry in dbEntries)
            {
                await EntryDB.InsertEntry(dbEntry).ConfigureAwait(false);
            }

            await trans.CommitAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}
