namespace Kiddo.DAL;

using Kiddo.Database.Models;

public class UserDAL
{
    private KiddoDbContextExtended DbContext { get; set; }

    public UserDAL(KiddoDbContextExtended dbContext)
    {
        DbContext = dbContext;
    }

    public int GetMaxDisplayNameLength()
    {
        foreach (Microsoft.EntityFrameworkCore.Metadata.IEntityType entity in DbContext.Model.GetEntityTypes())
        {
            Console.WriteLine(entity.Name);
        }
        int? length = DbContext.Model.GetEntityTypes().Where(e => e.Name == typeof(User).FullName).First().GetProperty(nameof(User.DisplayName)).GetMaxLength();
        return length ?? Int32.MaxValue;
    }

    public int GetMaxGivenNameLength()
    {
        int? length = DbContext.Model.GetEntityTypes().Where(e => e.Name == typeof(User).FullName).First().GetProperty(nameof(User.GivenName)).GetMaxLength();
        return length ?? Int32.MaxValue;
    }

    public int GetMaxSurnameLength()
    {
        int? length = DbContext.Model.GetEntityTypes().Where(e => e.Name == typeof(User).FullName).First().GetProperty(nameof(User.Surname)).GetMaxLength();
        return length ?? Int32.MaxValue;
    }

    public int GetMaxUserNameLength()
    {
        int? length = DbContext.Model.GetEntityTypes().Where(e => e.Name == typeof(User).FullName).First().GetProperty(nameof(User.UserName)).GetMaxLength();
        return length ?? Int32.MaxValue;
    }

    public int GetMaxEmailLength()
    {
        int? length = DbContext.Model.GetEntityTypes().Where(e => e.Name == typeof(User).FullName).First().GetProperty(nameof(User.Email)).GetMaxLength();
        return length ?? Int32.MaxValue;
    }

    public async Task<User> GetUser(Guid userId)
    {
        return await (
            from us in DbContext.Users
            where us.Id == userId
            select us).FirstAsync().ConfigureAwait(false);
    }

    public async Task<User?> GetUserByGraphId(string graphId)
    {
        return await (
            from usaad in DbContext.UserAzureAds
            where usaad.GraphId == graphId
            select usaad.User).FirstOrDefaultAsync().ConfigureAwait(false);
    }

    public async Task<List<UserAzureAd>> GetUserAzureAds(Guid userId)
    {
        return await (
            from usaad in DbContext.UserAzureAds
            where usaad.UserId == userId
            orderby usaad.UserAzureAdId
            select usaad).ToListAsync().ConfigureAwait(false);
    }

    public async Task<List<User>> GetAllUsers(int maxCount)
    {
        IOrderedQueryable<User> query = (
            from us in DbContext.Users
            orderby us.DisplayName, us.Id
            select us);

        return await (maxCount == Int32.MaxValue ? query : query.Take(maxCount)).ToListAsync().ConfigureAwait(false);
    }

    public async Task<int> GetAllUsersCount()
    {
        return await (
            from us in DbContext.Users
            select true).CountAsync().ConfigureAwait(false);
    }

    public async Task<List<User>> GetUsers(List<Guid> userIds)
    {
        return await (
            from us in DbContext.Users
            where userIds.Contains(us.Id)
            orderby us.Id
            select us).ToListAsync().ConfigureAwait(false);
    }

    public async Task<UserAzureAd?> GetUserAzureAdByGraphId(string graphId)
    {
        return await (
            from usaad in DbContext.UserAzureAds
            where usaad.GraphId == graphId
            select usaad).FirstOrDefaultAsync().ConfigureAwait(false);
    }

    public async Task<Guid?> GetUserIdByGraphId(string graphId)
    {
        return await (
            from usaad in DbContext.UserAzureAds
            where usaad.GraphId == graphId
            select (Guid?)usaad.UserId).FirstOrDefaultAsync().ConfigureAwait(false);
    }

    public async Task InsertUserAzureAd(UserAzureAd newRecord)
    {
        await DbContext.UserAzureAds.AddAsync(newRecord).ConfigureAwait(false);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task DeleteUserAzureAd(UserAzureAd rec)
    {
        DbContext.UserAzureAds.Remove(rec);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }
}
