namespace Kiddo.Web.Security;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Microsoft.Identity.Client;
using Microsoft.Identity.Web;
using System.Diagnostics.CodeAnalysis;

public class ManualGraphServiceClient : IManualGraphServiceClient
{
    private IOptionsMonitor<MicrosoftIdentityOptions> MicrosoftIdentityOptionsMonitor { get; set; }
    private IOptionsMonitor<ConfidentialClientApplicationOptions> ConfidentialClientApplicationOptionsMonitor { get; set; }
    private IOptionsMonitor<JwtBearerOptions> JwtBearerOptionsMonitor { get; set; }
    private GraphServiceClient? GraphClient { get; set; }
    private string? ManualAccessToken { get; set; }
    private bool IsInitialized { get; set; }
    private IConfidentialClientApplication? ConfidentialClientApp { get; set; }

    public ManualGraphServiceClient(IOptionsMonitor<MicrosoftIdentityOptions> microsoftIdentityOptionsMonitor, IOptionsMonitor<ConfidentialClientApplicationOptions> confidentialClicApplicationOptionsMonitor, IOptionsMonitor<JwtBearerOptions> jwtBearerOptionsMonitor)
    {
        MicrosoftIdentityOptionsMonitor = microsoftIdentityOptionsMonitor;
        ConfidentialClientApplicationOptionsMonitor = confidentialClicApplicationOptionsMonitor;
        JwtBearerOptionsMonitor = jwtBearerOptionsMonitor;
    }

    public GraphServiceClient GetClient(string manualAccessToken)
    {
        Initialize(manualAccessToken);

        return GraphClient;
    }

    [MemberNotNull(nameof(ManualAccessToken), nameof(GraphClient), nameof(ConfidentialClientApp))]
    private void Initialize(string manualAccessToken)
    {
        if (IsInitialized && manualAccessToken != ManualAccessToken) throw new Exception("Unable to proceed because a previous invocation used a different manualAccessToken value.");
        else if (IsInitialized && String.IsNullOrWhiteSpace(ManualAccessToken)) throw new Exception("Unable to instantiate GraphClient because the previous attempt failed due to a null or empty ManualAccessToken.");
        else if (IsInitialized && GraphClient == null) throw new Exception("Unable to instantiate GraphServiceClient because the previous attempt failed.");
#pragma warning disable CS8774 // Member must have a non-null value when exiting.
        else if (IsInitialized) return;
#pragma warning restore CS8774 // Member must have a non-null value when exiting.

        if (String.IsNullOrWhiteSpace(manualAccessToken)) throw new Exception("Cannot create GraphServiceClient because the ManualAccessToken is null or empty.");

        MicrosoftIdentityOptions identityOptions = MicrosoftIdentityOptionsMonitor.CurrentValue;
        ConfidentialClientApplicationOptions graphOptions = ConfidentialClientApplicationOptionsMonitor.Get(SecurityConstants.Scheme.AzureAd);
        JwtBearerOptions jwtOptions = JwtBearerOptionsMonitor.Get(SecurityConstants.Scheme.AzureAd);

        IConfidentialClientApplication confidentialClientApp = ConfidentialClientApplicationBuilder.CreateWithApplicationOptions(graphOptions)
                .WithTenantId(identityOptions.TenantId)
                .WithAuthority(jwtOptions.Authority)
                .WithClientSecret(identityOptions.ClientSecret)
                .Build();

        // Manual access token was provided.  We have to use that when retrieving information from MS Graph instead of the currently
        // logged in user provided by ICurrentUser.
        DelegateAuthenticationProvider authProvider = new(AuthenticateRequestAsyncDelegate);

        ManualAccessToken = manualAccessToken;
        ConfidentialClientApp = confidentialClientApp;
        GraphClient = new(authProvider);
    }

    private async Task AuthenticateRequestAsyncDelegate(HttpRequestMessage request)
    {
        if (ConfidentialClientApp == null) throw new Exception("Cannot provide authentication to Microsoft Graph because the IConfidentialClientApplication has not been instantiated.");

        AuthenticationResult authResult = await ConfidentialClientApp.AcquireTokenOnBehalfOf(MicrosoftIdentityOptionsMonitor.CurrentValue.Scope, new UserAssertion(ManualAccessToken)).ExecuteAsync().ConfigureAwait(false);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(Microsoft.Identity.Web.Constants.Bearer, authResult.AccessToken);
    }
}
