namespace Kiddo.BackgroundService.Models;

using Kiddo.BackgroundServiceContract.Service;
using Kiddo.Utility.SerialDispatchService;
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
        Guid jobId = DispatchQueue.Enqueue<CreateSampleInitJob>("CreateSampleInit");
        return jobId;
    }

    public class CreateSampleInitJob : IJob
    {
        private DAL.KiddoDAL DB { get; set; }
        private DAL.UserDAL UserDB { get; set; }
        private DAL.AccountDAL AccountDB { get; set; }
        private DAL.LookupTypeDAL LookupTypeDB { get; set; }

        public CreateSampleInitJob(DAL.KiddoDAL db, DAL.UserDAL userDB, DAL.AccountDAL accountDB, DAL.LookupTypeDAL lookupTypeDB)
        {
            DB = db;
            UserDB = userDB;
            AccountDB = accountDB;
            LookupTypeDB = lookupTypeDB;
        }

        public async Task Run(CancellationToken cancellationToken)
        {
            using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

            // Get the next free LookupId.
            int firstFreeLookupId = await LookupTypeDB.GetFreeLookupId().ConfigureAwait(false);

            // Users
            List<Database.Models.User> dbUsers = new() {
                new() { DisplayName = "Test User 1", GivenName = "Test1", Surname = "User1" },
                new() { DisplayName = "Test User 2", GivenName = "Test2", Surname = "User2" }
            };

            // Accounts
            List<Database.Models.Account> dbAccounts = new() {
                new() { Name = "Child 1", NameShort = "C1" },
                new() { Name = "Child 2", NameShort = "C2" }
            };

            // Currencies
            List<Database.Models.Lookup> dbLookups = new() {
                new() { LookupId = firstFreeLookupId + 0, Name = "Token 1", NameShort = "T1", IsActive = true, LookupTypeId = (int)Constants.LookupTypeType.Currency },
                new() { LookupId = firstFreeLookupId + 1, Name = "Token 2", NameShort = "T2", IsActive = true, LookupTypeId = (int)Constants.LookupTypeType.Currency },
                new() { LookupId = firstFreeLookupId + 2, Name = "Token 3", NameShort = "T3", IsActive = true, LookupTypeId = (int)Constants.LookupTypeType.Currency }
            };

            // Write the changes to the database
            foreach (Database.Models.User dbUser in dbUsers)
            {
                //await UserDB.InsertUser(dbUser).ConfigureAwait(false);
            }

            foreach (Database.Models.Account dbAccount in dbAccounts)
            {
                await AccountDB.InsertAccount(dbAccount).ConfigureAwait(false);
            }

            await LookupTypeDB.InsertLookups(dbLookups).ConfigureAwait(false);

            await trans.CommitAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}
