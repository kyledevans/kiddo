namespace Kiddo.Web.Configuration;

using Microsoft.Extensions.DependencyInjection;

public class SpaOptions
{
    public string Url { get; set; } = String.Empty;
    public List<WebContract.AuthenticationMethodType> AuthMethods { get; set; } = new();
    public WebContract.AuthenticationMethodType? DefaultAuthMethod { get; set; }
    public bool IsRegistrationEnabled { get; set; } = true;
    public bool IsEmailConfirmationRequired { get; set; } = true;
}

public static class SpaConfigurationExtensions
{
    public static void AddCustomSpaConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // TODO: This could use some more forgiving parse logic, and more detailed error logging.

        services.AddOptions<SpaOptions>()
            //.Bind(configuration.GetSection("Spa"))
            .BindConfiguration("Spa");

        /*SpaConfiguration spaConfig = new();
        bool isSpaConfigValid = true;
        configuration.Bind("SpaConfiguration", spaConfig);

        // Validation
        if (string.IsNullOrWhiteSpace(spaConfig.Url))
        {
            Log.Fatal("Missing SPA configuration: SpaConfiguration.Url must be set.");
            isSpaConfigValid = false;
        }
        else if (!spaConfig.Url.EndsWith('/'))
        {
            Log.Fatal("Missing SPA configuration: SpaConfiguration.Url must have a trailing \"/\" character.");
        }
        if (spaConfig.AuthMethods.Count == 0)
        {
            Log.Fatal("At least 1 authentication method must be specified.  SpaConfiguration.AuthMethods must be an array of strings.");
            isSpaConfigValid = false;
        }

        if (isSpaConfigValid)
        {
            services.AddSingleton<Abstractions.ISpaConfiguration>(spaConfig);
        }
        else
        {
            throw new Exception("Invalid SPA configuration.  Startup aborted.");
        }*/
    }
}
