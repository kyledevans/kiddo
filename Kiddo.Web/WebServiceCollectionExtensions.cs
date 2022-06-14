namespace Kiddo.Web.DependencyInjection;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;
using Microsoft.Identity.Web;
using Microsoft.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Kiddo.Web.Configuration;
using Kiddo.Web.Security;
using Microsoft.OpenApi.Models;

public static class WebServiceCollectionExtensions
{
    public static IServiceCollection AddCustomSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(config => {
            /* Note: The following lines require that the *.csproj file be modified to have the following 2 settings:
               <GenerateDocumentationFile>true</GenerateDocumentationFile>
               <NoWarn>$(NoWarn);1591</NoWarn>
             * 
             * These need to be placed within the <PropertyGroup> node (it's near the top).
             */

            // Set the comments path for the Swagger JSON and UI.
            string xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
            string xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            config.IncludeXmlComments(xmlPath);

            config.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new() {
                In = ParameterLocation.Header,
                Description = "Please enter token",
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                BearerFormat = "JWT",
                Scheme = JwtBearerDefaults.AuthenticationScheme
            });
            config.AddSecurityRequirement(new()
            {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new()
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = JwtBearerDefaults.AuthenticationScheme
                    }
                },
                Array.Empty<string>()
            }
        });
            config.CustomSchemaIds(type => type.ToString());
        });

        return services;
    }

    public static IServiceCollection AddCustomSpaOptions(this IServiceCollection services)
    {
        // TODO: This could use some more forgiving parse logic, and more detailed error logging.

        services.AddOptions<SpaOptions>()
            //.Bind(configuration.GetSection("Spa"))
            .BindConfiguration("Spa");

        return services;

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

    public static IServiceCollection AddCustomSmtpOptions(this IServiceCollection services)
    {
        services.AddOptions<SmtpOptions>()
            .BindConfiguration("Smtp");

        return services;
    }

    public static IServiceCollection AddCustomModels(this IServiceCollection services)
    {
        services.AddScoped<Models.AppModel>();
        services.AddScoped<Models.AccountModel>();
        services.AddScoped<Models.EntryModel>();
        services.AddScoped<Models.LookupTypeModel>();
        services.AddScoped<Models.UserModel>();
        services.AddScoped<Models.ProfileModel>();
        services.AddScoped<Models.IdentityModel>();
        services.AddScoped<Models.AzureAdModel>();
        services.AddScoped<Models.EmailSender>();
        services.AddScoped<Models.Validators>();

        return services;
    }

    public static IServiceCollection AddCustomMappers(this IServiceCollection services)
    {
        // Add AutoMapper methods for basic conversion between various layer DTOs.  This will handle simple properties like integers, strings, etc.  Value types like
        // lists and objects need higher order methods to help ensure that only intended values are copied.  These higher order methods can be found in the Mappers folder.
        // Additionally, certain fields need to be manually assigned from the BL when converting from WebContract to database models.  For example DateAddedUtc timestamps
        // shouldn't be copied from the API caller.
        services.AddAutoMapper(config => {
            config.CreateMap<Kiddo.Database.Models.LookupType, Kiddo.WebContract.LookupType.LookupType>().ForMember(l => l.Lookups, op => op.Ignore());
            config.CreateMap<Kiddo.Database.Models.Lookup, Kiddo.WebContract.LookupType.Lookup>();
            config.CreateMap<Kiddo.WebContract.LookupType.Lookup, Kiddo.Database.Models.Lookup>();
            config.CreateMap<Kiddo.Database.Models.Entry, Kiddo.WebContract.Entry.Entry>();
            config.CreateMap<Kiddo.WebContract.Entry.Entry, Kiddo.Database.Models.Entry>().ForMember(e => e.DateAddedUtc, op => op.Ignore()).ForMember(e => e.UserId, op => op.Ignore());
            config.CreateMap<Kiddo.Database.Models.User, Kiddo.WebContract.User.SearchUser>().ForMember(e => e.UserId, op => op.MapFrom(source => source.Id));
            config.CreateMap<Kiddo.Database.Models.User, Kiddo.WebContract.User.User>().ForMember(e => e.UserId, op => op.MapFrom(source => source.Id));
            config.CreateMap<Kiddo.WebContract.User.User, Kiddo.Database.Models.User>().ForMember(e => e.Id, op => op.MapFrom(source => source.UserId));
            config.CreateMap<Kiddo.DAL.QueryModels.AccountCurrencySummary, Kiddo.WebContract.Account.AccountCurrencySummary>();
            config.CreateMap<Kiddo.Database.Models.Account, Kiddo.WebContract.Account.Account>();
            config.CreateMap<Kiddo.WebContract.Account.Account, Kiddo.Database.Models.Account>();
            config.CreateMap<Kiddo.Database.Models.Account, Kiddo.WebContract.Account.SearchAccountResult>();
            config.CreateMap<SpaOptions, Kiddo.WebContract.App.SpaConfiguration>();
            config.CreateMap<Kiddo.Database.Models.User, Kiddo.WebContract.Profile.Profile>().ForMember(e => e.UserId, op => op.MapFrom(source => source.Id)).ForMember(e => e.IsEmailConfirmed, op => op.MapFrom(source => source.EmailConfirmed));
            config.CreateMap<Microsoft.AspNetCore.Identity.PasswordOptions, Kiddo.WebContract.Identity.PasswordValidationRules>();
            config.CreateMap<Microsoft.AspNetCore.Identity.IdentityError, Kiddo.WebContract.Identity.IdentityError>();
        });

        return services;
    }

    public static IServiceCollection AddCustomAuthentication(this IServiceCollection services, IConfiguration configuration)
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
        services.AddScoped<ICurrentUserProvider, CurrentUserProvider>();

        // Add ASP.Net Core Identity.
        services.AddIdentityCore<Kiddo.Database.Models.User>()
            .AddSignInManager<SignInManager<Kiddo.Database.Models.User>>()
            .AddRoles<Kiddo.Database.Models.Role>()
            .AddEntityFrameworkStores<Kiddo.DAL.KiddoDbContextExtended>()
            .AddDefaultTokenProviders();

        AuthenticationBuilder authBuilder = services.AddAuthentication(SecurityConstants.Scheme.Selector)
            .AddScheme<PolicySchemeOptions, PolicySchemeHandler>(SecurityConstants.Scheme.Selector, SecurityConstants.Scheme.Selector, null)
            .AddScheme<JwtBearerOptions, SchemeEnabledJwtBearerHandler>(SecurityConstants.Scheme.AspNetIdentity, SecurityConstants.Scheme.AspNetIdentity, null);

        authBuilder.AddMicrosoftIdentityWebApi(configuration.GetSection(SecurityConstants.AzureAd.ApiAzureAdOptions), SecurityConstants.Scheme.AzureAd)
            .EnableTokenAcquisitionToCallDownstreamApi()
            .AddMicrosoftGraph(configuration.GetSection(SecurityConstants.AzureAd.ApiGraphOptions))
            .AddInMemoryTokenCaches();

        services.AddAuthentication(options => {
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

        return services;
    }

    public static IServiceCollection AddCustomAuthorization(this IServiceCollection services, IConfiguration configuration)
    {
        // Add authorization policies
        services.AddAuthorization(options => {
            // Policy for either aspnet identity tokens (both refresh and access).
            options.AddPolicy(SecurityConstants.Policy.AspNetIdentity, policy => {
                policy.RequireAuthenticatedUser()
                    .RequireScope(SecurityConstants.Scopes.KiddoAccess)
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AspNetIdentity)
                    .RequireClaim(SecurityConstants.ClaimType.Issuer, SecurityConstants.AspNetIdentity.Issuer);
            });
            // Policy for just aspnet identity access tokens.
            options.AddPolicy(SecurityConstants.Policy.AspNetIdentityAccess, policy => {
                policy.RequireAuthenticatedUser()
                    .RequireScope(SecurityConstants.Scopes.KiddoAccess)
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AspNetIdentity)
                    .RequireClaim(SecurityConstants.ClaimType.Issuer, SecurityConstants.AspNetIdentity.Issuer)
                    .RequireClaim(SecurityConstants.ClaimType.Audience, SecurityConstants.AspNetIdentity.AccessTokenAudience);
            });
            // Policy for just aspnet identity refresh tokens.
            options.AddPolicy(SecurityConstants.Policy.AspNetIdentityRefresh, policy => {
                policy.RequireAuthenticatedUser()
                    .RequireScope(SecurityConstants.Scopes.KiddoAccess)
                    .AddAuthenticationSchemes(SecurityConstants.Scheme.AspNetIdentity)
                    .RequireClaim(SecurityConstants.ClaimType.Issuer, SecurityConstants.AspNetIdentity.Issuer)
                    .RequireClaim(SecurityConstants.ClaimType.Audience, SecurityConstants.AspNetIdentity.RefreshTokenAudience);
            });
            // Policy for Azure Ad authentication.
            options.AddPolicy(SecurityConstants.Policy.AzureAd, policy => {
                policy.RequireAuthenticatedUser()
                    .RequireScope(SecurityConstants.Scopes.KiddoAccess)
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
            options.AddPolicy(SecurityConstants.Policy.SuperAdministrator, p => { p.RequireAuthenticatedUser().RequireScope(SecurityConstants.Scopes.KiddoAccess).RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator) }); });
            options.AddPolicy(SecurityConstants.Policy.Administrator, p => { p.RequireAuthenticatedUser().RequireScope(SecurityConstants.Scopes.KiddoAccess).RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator), nameof(Kiddo.Constants.SecurityRoleType.Administrator) }); });
            options.AddPolicy(SecurityConstants.Policy.User, p => { p.RequireAuthenticatedUser().RequireScope(SecurityConstants.Scopes.KiddoAccess).RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator), nameof(Kiddo.Constants.SecurityRoleType.Administrator), nameof(Kiddo.Constants.SecurityRoleType.User) }); });
            options.AddPolicy(SecurityConstants.Policy.ReadOnlyUser, p => { p.RequireAuthenticatedUser().RequireScope(SecurityConstants.Scopes.KiddoAccess).RequireRole(new string[] { nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator), nameof(Kiddo.Constants.SecurityRoleType.Administrator), nameof(Kiddo.Constants.SecurityRoleType.User), nameof(Kiddo.Constants.SecurityRoleType.ReadOnlyUser) }); });
        });

        return services;
    }
}
