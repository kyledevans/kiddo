namespace Kiddo.Web.Security;

using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using Serilog;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Graph.ExternalConnectors;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using Microsoft.Identity.Client;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Microsoft.Graph;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using Kiddo.Web.Configuration;

public static class SecurityExtensionMethods
{
    public static void AddCustomSecurity(this IServiceCollection services, IConfiguration configuration)
    {
        // Dependencies on other services.
        services.AddOptions()
            .AddLogging()
            .AddHttpContextAccessor();

        // Abstraction for initial settings for users on registration.
        services.AddScoped<IUserRegistrationBehavior, UserRegistrationBehavior>();

        // Pull password complexity requirements from appsettings.json.
        services.AddOptions<IdentityOptions>()
            .Configure(options => {
                // Note that the Asp Net Core Identity framework internally accesses the IdentityOptions by referencing the dependency IOptions<IdentityOption>.
                // This means that we cannot use the slightly easier to use syntax: services.AddOptions<...>().BindConfiguration("section...").
                configuration.Bind(SecurityConstants.AspNetIdentity.PasswordOptions, options.Password);
                options.User.RequireUniqueEmail = true; // Use email addresses as the username.
            })
            .PostConfigure<IOptionsMonitor<SpaOptions>>((options, spaOptionsMonitor) => {
                // This needs to be a post-configuration because we are actually pulling it from the SpaOptions section, and that needs a chance to bind first.
                options.SignIn.RequireConfirmedEmail = spaOptionsMonitor.CurrentValue.IsEmailConfirmationRequired;
            });

        services.AddOptions<IdentityOptions>()
            .Configure(options => {
                // Note that the Asp Net Core Identity framework internally accesses the IdentityOptions by referencing the dependency IOptions<IdentityOption>.
                // This means that we cannot use the slightly easier to use syntax: services.AddOptions<...>().BindConfiguration("section...").
                configuration.Bind(SecurityConstants.AspNetIdentity.PasswordOptions, options.Password);
            });

        services.AddOptions<SpaAzureAdOptions>()
            .BindConfiguration(SecurityConstants.AzureAd.SpaAzureAdOptions);

        services.AddSingleton<JwtSigningKey>((services) => {
            string? secretKey = configuration.GetValue<string?>(SecurityConstants.AspNetIdentity.SecurityKeyOptions);
            if (secretKey == null) throw new Exception($"{SecurityConstants.AspNetIdentity.SecurityKeyOptions} was not defined in appsettings.json.");
            JwtSigningKey signingKey = new(System.Text.Encoding.UTF8.GetBytes(secretKey));
            return signingKey;
        });

        services.AddSingleton<IJwtUtils, JwtUtils>();
        services.AddScoped<IClaimsTransformation, SecurityRoleClaimsTransformation>();
        services.AddSingleton<AuthenticationMethodEnablementMiddleware>();

        // Add ASP.Net Core Identity.
        services.AddIdentityCore<Kiddo.Database.Models.User>()
            .AddSignInManager<SignInManager<Kiddo.Database.Models.User>>()
            .AddRoles<Kiddo.Database.Models.Role>()
            .AddEntityFrameworkStores<Kiddo.DAL.KiddoDbContextExtended>()
            .AddDefaultTokenProviders();

        AuthenticationBuilder authBuilder = services.AddAuthentication(SecurityConstants.Scheme.Selector)
            .AddScheme<PolicySchemeOptions, PolicySchemeHandler>(SecurityConstants.Scheme.Selector, SecurityConstants.Scheme.Selector, null)
            //.AddScheme<JwtBearerOptions, SchemeEnabledJwtBearerHandler>(SecurityConstants.Scheme.AzureAd, SecurityConstants.Scheme.AzureAd, null)
            .AddScheme<JwtBearerOptions, SchemeEnabledJwtBearerHandler>(SecurityConstants.Scheme.AspNetIdentity, SecurityConstants.Scheme.AspNetIdentity, null);

        authBuilder.AddMicrosoftIdentityWebApi(configuration.GetSection(SecurityConstants.AzureAd.ApiAzureAdOptions), SecurityConstants.Scheme.AzureAd)
            .EnableTokenAcquisitionToCallDownstreamApi()
            .AddMicrosoftGraph(configuration.GetSection(SecurityConstants.AzureAd.ApiGraphOptions))
            .AddInMemoryTokenCaches();

        services.AddAuthentication(options =>
        {
            options.Schemes.Where(s => s.Name == SecurityConstants.Scheme.AzureAd).First().HandlerType = typeof(SchemeEnabledJwtBearerHandler);
        });

        // These options are normally handled entirely by the AzureAD SDK.  However in order for them to
        // be usable by the ManualGraphServiceClient they need to be manually bound here.
        services.AddOptions<MicrosoftIdentityOptions>()
            .BindConfiguration("ApiAzureAd");
        services.AddOptions<ConfidentialClientApplicationOptions>()
            .BindConfiguration("ApiGraph");
        services.AddScoped<IManualGraphServiceClient, ManualGraphServiceClient>();

        services.AddOptions<PolicySchemeOptions>(SecurityConstants.Scheme.Selector)
            .Configure<IOptions<SpaOptions>>((options, spaOptions) => {
                options.ForwardDefaultSelector = context => {
                    context.Request.Headers.TryGetValue(HeaderNames.Authorization, out Microsoft.Extensions.Primitives.StringValues authHeader);
                    if (authHeader.Count == 0) return SecurityConstants.Scheme.AspNetIdentity;
                    string encodedToken = authHeader.First().Substring(JwtBearerDefaults.AuthenticationScheme.Length + 1);
                    JwtSecurityTokenHandler jwtHandler = new();
                    JwtSecurityToken token = jwtHandler.ReadJwtToken(encodedToken);

                    // TODO: Figure out a better way to determine the issuer is from Azure AD.
                    if (token.Issuer.StartsWith(SecurityConstants.AzureAd.IssuerPrefix)) return SecurityConstants.Scheme.AzureAd;
                    else return SecurityConstants.Scheme.AspNetIdentity;
                };
            });

        services.AddOptions<JwtBearerOptions>(SecurityConstants.Scheme.AspNetIdentity)
            .Configure<JwtSigningKey, IOptions<SpaOptions>>((options, signingKey, spaOptions) => {
                options.TokenValidationParameters = new() {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = signingKey,
                    ValidIssuer = SecurityConstants.AspNetIdentity.Issuer,
                    ValidAudiences = new[] { SecurityConstants.AspNetIdentity.AccessTokenAudience, SecurityConstants.AspNetIdentity.RefreshTokenAudience },
                    ClockSkew = TimeSpan.Zero
                };
            });

        // Add authorization policies
        services.AddAuthorization(options => {
            // Policy for either aspnet identity tokens (both refresh and access).
            options.AddPolicy(SecurityConstants.Policy.AspNetIdentity, policy => {
                policy.RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AspNetIdentity)
                    .RequireClaim(SecurityConstants.ClaimType.Issuer, SecurityConstants.AspNetIdentity.Issuer);
            });
            // Policy for just aspnet identity access tokens.
            options.AddPolicy(SecurityConstants.Policy.AspNetIdentityAccess, policy => {
                policy.RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AspNetIdentity)
                    .RequireClaim(SecurityConstants.ClaimType.Issuer, SecurityConstants.AspNetIdentity.Issuer)
                    .RequireClaim(SecurityConstants.ClaimType.Audience, SecurityConstants.AspNetIdentity.AccessTokenAudience);
            });
            // Policy for just aspnet identity refresh tokens.
            options.AddPolicy(SecurityConstants.Policy.AspNetIdentityRefresh, policy => {
                policy.RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AspNetIdentity)
                    .RequireClaim(SecurityConstants.ClaimType.Issuer, SecurityConstants.AspNetIdentity.Issuer)
                    .RequireClaim(SecurityConstants.ClaimType.Audience, SecurityConstants.AspNetIdentity.RefreshTokenAudience);
            });
            // Policy for Azure Ad authentication.
            options.AddPolicy(SecurityConstants.Policy.AzureAd, policy => {
                policy.RequireAuthenticatedUser()
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AzureAd)
                    .RequireAssertion(handler => {
                        // TODO: Probably need to figure out why AddAuthenticationSchemes() isn't working.
                        Claim? issuerClaim = handler.User.Claims.FirstOrDefault(c => c.Type == SecurityConstants.ClaimType.Issuer);
                        if (issuerClaim != null)
                        {
                            return issuerClaim.Value.StartsWith(SecurityConstants.AzureAd.IssuerPrefix);
                        }
                        return false;
                    });
            });
            options.AddPolicy(SecurityConstants.Policy.SuperAdministrator, p => { p.RequireAuthenticatedUser().RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator) }); });
            options.AddPolicy(SecurityConstants.Policy.Administrator, p => { p.RequireAuthenticatedUser().RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator), nameof(Kiddo.Constants.SecurityRoleType.Administrator) }); });
            options.AddPolicy(SecurityConstants.Policy.User, p => { p.RequireAuthenticatedUser().RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator), nameof(Kiddo.Constants.SecurityRoleType.Administrator), nameof(Kiddo.Constants.SecurityRoleType.User) }); });
            options.AddPolicy(SecurityConstants.Policy.ReadOnlyUser, p => { p.RequireAuthenticatedUser().RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator), nameof(Kiddo.Constants.SecurityRoleType.Administrator), nameof(Kiddo.Constants.SecurityRoleType.User), nameof(Kiddo.Constants.SecurityRoleType.ReadOnlyUser) }); });
        });
    }
}
