namespace Kiddo.DAL.DependencyInjection;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

public static class DALServiceCollectionExtensions
{
    public static void AddCustomDAL(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<KiddoDbContextExtended>(options =>
            options.UseSqlServer(configuration.GetConnectionString("kiddo"))
        );

        services.AddScoped<KiddoDAL>();
        services.AddScoped<LookupTypeDAL>();
        services.AddScoped<EntryDAL>();
        services.AddScoped<UserDAL>();
        services.AddScoped<AccountDAL>();
    }
}
