namespace Kiddo.Web.Models;

using Microsoft.Graph;
using System.Reflection;
using AutoMapper;
using Microsoft.Identity.Web;
using Microsoft.Extensions.Options;

public class AppModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private GraphServiceClient GraphClient { get; set; }
    private Abstractions.ICurrentUserProvider CurrentUserProvider { get; set; }
    private ILogger Logger { get; set; }
    private Implementations.SpaOptions SpaConfiguration { get; set; }
    private Web.Security.SpaAzureAdOptions SpaAzureAdOptions { get; set; }
    private IMapper Mapper { get; set; }

    public AppModel(ILogger<AppModel> logger, DAL.KiddoDAL db, DAL.UserDAL userDB, Abstractions.ICurrentUserProvider currentUserProvider, IOptionsMonitor<Implementations.SpaOptions> spaConfigurationMonitor, IMapper mapper, IOptionsMonitor<Web.Security.SpaAzureAdOptions> spaAzureAdOptions, GraphServiceClient? graphClient = null)
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
        WebContract.App.SpaConfiguration retval = Mapper.Map<Implementations.SpaOptions, WebContract.App.SpaConfiguration>(SpaConfiguration);
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
