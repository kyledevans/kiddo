namespace Kiddo.Web.Models;

using Microsoft.Graph;
using System.Reflection;
using AutoMapper;
using Microsoft.Identity.Web;
using Microsoft.Extensions.Options;
using Kiddo.Web.Configuration;
using Kiddo.Web.Security;

public class AppModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private GraphServiceClient GraphClient { get; set; }
    private ICurrentUserProvider CurrentUserProvider { get; set; }
    private ILogger Logger { get; set; }
    private SpaOptions SpaConfiguration { get; set; }
    private SpaAzureAdOptions SpaAzureAdOptions { get; set; }
    private IMapper Mapper { get; set; }

    public AppModel(ILogger<AppModel> logger, DAL.KiddoDAL db, DAL.UserDAL userDB, ICurrentUserProvider currentUserProvider, IOptionsMonitor<SpaOptions> spaConfigurationMonitor, IMapper mapper, IOptionsMonitor<SpaAzureAdOptions> spaAzureAdOptions, GraphServiceClient? graphClient = null)
    {
        if (graphClient == null)
        {
            throw new ArgumentNullException(nameof(graphClient));
        }

        Logger = logger;
        DB = db;
        UserDB = userDB;
        GraphClient = graphClient;
        CurrentUserProvider = currentUserProvider;
        SpaConfiguration = spaConfigurationMonitor.CurrentValue;
        SpaAzureAdOptions = spaAzureAdOptions.CurrentValue;
        Mapper = mapper;
    }

    public WebContract.App.SpaConfiguration GetSpaConfiguration()
    {
        WebContract.App.SpaConfiguration retval = Mapper.Map<SpaOptions, WebContract.App.SpaConfiguration>(SpaConfiguration);
        retval.MsalClientId = SpaAzureAdOptions.MsalClientId;
        retval.MsalAuthority = SpaAzureAdOptions.MsalAuthority;
        retval.MsalScopes = SpaAzureAdOptions.MsalScopes;

        return retval;
    }

    public async Task<WebContract.App.ApplicationInfo> GetApplicationInfo()
    {
        WebContract.App.ApplicationInfo retval = new() {
            Version = "",
            DisplayName = "",
            UserId = Guid.Empty
        };

        Assembly? assembly = Assembly.GetEntryAssembly();
        if (assembly != null)
        {
            AssemblyFileVersionAttribute? attr = assembly.GetCustomAttribute<AssemblyFileVersionAttribute>();
            if (attr != null)
            {
                retval.Version = attr.Version;
            }
        }

        Database.Models.User dbUser = await UserDB.GetUser(await CurrentUserProvider.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);

        retval.DisplayName = dbUser.DisplayName;
        retval.UserId = dbUser.Id;

        return retval;
    }
}
