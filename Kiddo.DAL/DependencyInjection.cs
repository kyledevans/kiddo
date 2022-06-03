namespace Kiddo.DAL;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

public static class DependencyInjection
{
    public static void AddCustomDAL(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<KiddoDbContextExtended>(options =>
            options.UseSqlServer(configuration.GetConnectionString("kiddo"))
        );

        // Note: This assumes that the AspNet identity tables are stored in the same database as the rest of the application.  There are not intended to be any
        // foreign keys constraints or other database enforced references between the app and the AspNet tables.  That way the AspNet identity functionality can be
        // deleted without majorly impacting the rest of the app.
        /*services.AddDbContext<Database.KiddoDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("kiddo"))
        );*/

        services.AddScoped<KiddoDAL>();
        services.AddScoped<LookupTypeDAL>();
        services.AddScoped<EntryDAL>();
        services.AddScoped<UserDAL>();
        services.AddScoped<AccountDAL>();
    }
}
