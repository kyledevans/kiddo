namespace Kiddo.Web.Models;

using Microsoft.AspNetCore.Identity;
using Microsoft.Graph;
using Microsoft.Identity.Web;
using System.Diagnostics.CodeAnalysis;
using Kiddo.WebContract.AzureAd;
using Kiddo.Web.Security;
using AutoMapper;

public class AzureAdModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private IMapper Mapper { get; set; }
    private GraphServiceClient GraphClient { get; set; }
    private ICurrentUserProvider CurrentUser { get; set; }
    private ILogger Logger { get; set; }
    private UserManager<Database.Models.User> UserManager { get; set; }
    private IUserRegistrationBehavior RegistrationBehavior { get; set; }
    private IManualGraphServiceClient ManualGraphClient { get; set; }
    private Validators Validators { get; set; }

    public AzureAdModel(Validators validators, ILogger<ProfileModel> logger, IMapper mapper, UserManager<Database.Models.User> userManager, GraphServiceClient graphClient, DAL.KiddoDAL db, DAL.UserDAL userDB, ICurrentUserProvider currentUser, IUserRegistrationBehavior registrationBehavior, IManualGraphServiceClient manualGraphClient)
    {
        Logger = logger;
        DB = db;
        UserDB = userDB;
        Mapper = mapper;
        CurrentUser = currentUser;
        GraphClient = graphClient;
        UserManager = userManager;
        RegistrationBehavior = registrationBehavior;
        ManualGraphClient = manualGraphClient;
        Validators = validators;
    }

    public async Task<List<AccountLink>> GetAccountLinks()
    {
        Guid userId = await CurrentUser.GetUserIdRequired().ConfigureAwait(false);
        Database.Models.User dbUser = await UserDB.GetUser(userId).ConfigureAwait(false);
        IList<UserLoginInfo> logins = await UserManager.GetLoginsAsync(dbUser).ConfigureAwait(false);
        List<AccountLink> retval = new();

        foreach (UserLoginInfo userLogin in logins)
        {
            Database.Models.JsonFields.UserLoginAzureAdInformation? graphUser = System.Text.Json.JsonSerializer.Deserialize<Database.Models.JsonFields.UserLoginAzureAdInformation>(userLogin.ProviderDisplayName);
            if (graphUser == null)
            {
                continue;
            }
            else
            {
                retval.Add(new() {
                    DisplayName = graphUser.DisplayName ?? String.Empty,
                    Email = graphUser.Email ?? String.Empty,
                    GivenName = graphUser.GivenName ?? String.Empty,
                    Surname = graphUser.Surname ?? String.Empty,
                    GraphId = userLogin.ProviderKey,
                    ProviderKey = userLogin.ProviderKey,
                    LoginProvider = SecurityConstants.Scheme.AzureAd
                });
            }
        }

        return retval;
    }

    public async Task<List<AccountLink>> GetAccountLinksByUserId(Guid userId)
    {
        Database.Models.User dbUser = await UserDB.GetUser(userId).ConfigureAwait(false);
        IList<UserLoginInfo> logins = await UserManager.GetLoginsAsync(dbUser).ConfigureAwait(false);
        List<AccountLink> retval = new();

        foreach (UserLoginInfo userLogin in logins)
        {
            Database.Models.JsonFields.UserLoginAzureAdInformation? graphUser = System.Text.Json.JsonSerializer.Deserialize<Database.Models.JsonFields.UserLoginAzureAdInformation>(userLogin.ProviderDisplayName);

            if (graphUser == null)
            {
                continue;
            }
            else
            {
                retval.Add(new() {
                    DisplayName = graphUser.DisplayName ?? String.Empty,
                    Email = graphUser.Email ?? String.Empty,
                    GivenName = graphUser.GivenName ?? String.Empty,
                    Surname = graphUser.Surname ?? String.Empty,
                    GraphId = userLogin.ProviderKey,
                    ProviderKey = userLogin.ProviderKey,
                    LoginProvider = SecurityConstants.Scheme.AzureAd
                });
            }
        }

        return retval;
    }

    private bool ValidateProfileFields([NotNullWhen(true)] string? displayName, [NotNullWhen(true)] string? givenName, [NotNullWhen(true)] string? surname, [NotNullWhen(true)] string? email)
    {
        if (String.IsNullOrWhiteSpace(email) || String.IsNullOrWhiteSpace(displayName) || String.IsNullOrWhiteSpace(givenName) || String.IsNullOrWhiteSpace(surname)) return false;
        else if (!Validators.IsStorableDisplayName(displayName)) return false;
        else if (!Validators.IsStorableGivenName(givenName)) return false;
        else if (!Validators.IsStorableSurname(surname)) return false;
        else if (!Validators.IsStorableUserNameAndEmail(email)) return false;

        return true;
    }

    private async Task<( string graphId, User graphUser )> GetUserGraphInformation(string? manualAccessToken)
    {
        string? graphId;
        User? graphUser;

        if (!String.IsNullOrWhiteSpace(manualAccessToken))
        {
            graphUser = await ManualGraphClient.GetClient(manualAccessToken).Me.Request().GetAsync().ConfigureAwait(false);
            if (graphUser == null) throw new Exception($"Unable to retrieve user record from Microsoft Graph API.");
            graphId = graphUser.Id;
        }
        else
        {
            // Using the access token supplied in the request headers.
            graphId = await CurrentUser.GetAzureAdIdentifier().ConfigureAwait(false);
            if (graphId == null) throw new Exception($"Unable to find Microsoft Graph user Id: {graphId}).");
            graphUser = await GraphClient.Me.Request().WithAuthenticationScheme(SecurityConstants.Scheme.AzureAd).GetAsync().ConfigureAwait(false);
            if (graphUser == null) throw new Exception($"Unable to retrieve user record from Microsoft Graph API (Microsoft Graph user Id: {graphId}).");
        }

        return (graphId, graphUser);
    }

    public async Task RemoveLink(string providerKey)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        Database.Models.User dbUser = await UserDB.GetUser(await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);
        await UserManager.RemoveLoginAsync(dbUser, SecurityConstants.Scheme.AzureAd, providerKey).ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);
    }

    public async Task<RegisterResponse> Register(RegisterRequest? manualEntry, string? manualAccessToken)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        Database.Models.User? dbUser;
        string graphId;
        User graphUser;
        RegisterResponse retval;
        string? displayName, givenName, surname, email; // Contains values provided by manualEntry parameter or the values retrieved directly from Azure AD.
        Database.Models.User? existingUser;

        // Retrieve information from Microsoft Graph.
        (graphId, graphUser) = await GetUserGraphInformation(manualAccessToken).ConfigureAwait(false);

        dbUser = await UserManager.FindByLoginAsync(SecurityConstants.Scheme.AzureAd, graphUser.Id).ConfigureAwait(false);

        // Get the application user if possible.
        if (dbUser == null)
        {
            // The Azure AD user has not yet been registered.
            if (!await RegistrationBehavior.GetIsRegistrationAllowed().ConfigureAwait(false)) throw new Exception("Registration is not enabled.");

            displayName = manualEntry != null ? manualEntry.DisplayName : graphUser.DisplayName;
            givenName = manualEntry != null ? manualEntry.GivenName : graphUser.GivenName;
            surname = manualEntry != null ? manualEntry.Surname : graphUser.Surname;
            email = manualEntry != null ? manualEntry.Email : graphUser.Mail;

            bool isValidProfile = ValidateProfileFields(displayName, givenName, surname, email);

            // Failed validation.  Abort but provide some pre-filled profile data for a better user experience.
            if (!isValidProfile && String.IsNullOrWhiteSpace(manualAccessToken))
            {
                RegisterPrefillData prefill = new() {
                    DisplayName = Validators.IsStorableDisplayName(displayName) ? displayName : null,
                    GivenName = Validators.IsStorableGivenName(givenName) ? givenName : null,
                    Surname = Validators.IsStorableSurname(surname) ? surname : null,
                    Email = Validators.IsStorableUserNameAndEmail(email) ? email : null
                };
                retval = new() { StatusCode = RegisterStatusCodeType.InvalidFields, PrefillData = prefill };
                return retval;
            }

            // Try and automatically link an existing application user to the Azure AD user based on the email address.
            if (String.IsNullOrWhiteSpace(manualAccessToken))
            {
                existingUser = await UserManager.FindByEmailAsync(email).ConfigureAwait(false);
            }
            else
            {
                existingUser = await UserManager.FindByIdAsync((await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ToString()).ConfigureAwait(false);
            }

            if (existingUser == null)
            {
                // Clean slate.  The Azure AD user has not been registered yet and we haven't found any pre-existing users that have the same email address.

                dbUser = new() {
                    UserName = email.Trim(),
                    DisplayName = displayName.Trim(),
                    GivenName = givenName.Trim(),
                    Surname = surname.Trim(),
                    Email = email.Trim(),
                    EmailConfirmed = true   // Automatically assume the email address is confirmed, because we are trusting that Microsoft has performed this step.
                };

                Database.Models.JsonFields.UserLoginAzureAdInformation userAzureAdInformation = new() {
                    DisplayName = graphUser.DisplayName,
                    GivenName = graphUser.GivenName,
                    Surname = graphUser.Surname,
                    Email = graphUser.Mail
                };

                Kiddo.Constants.SecurityRoleType? initialRole = await RegistrationBehavior.GetInitialRole().ConfigureAwait(false);
                if (initialRole == null) throw new Exception("initialRole cannot be null.");

                await UserManager.CreateAsync(dbUser).ConfigureAwait(false);
                await UserManager.AddToRoleAsync(dbUser, initialRole.ToString()).ConfigureAwait(false);
                await UserManager.AddLoginAsync(dbUser, new(SecurityConstants.Scheme.AzureAd, graphUser.Id, System.Text.Json.JsonSerializer.Serialize(userAzureAdInformation))).ConfigureAwait(false);
                await trans.CommitAsync().ConfigureAwait(false);

                Logger.LogInformation($"Registered user from Azure AD.  (Microsoft Graph user Id: {graphId}).  Application user Id: {dbUser.Id}.");
                retval = new() { StatusCode = RegisterStatusCodeType.Success, UserId = dbUser.Id };
            }
            else if (!UserManager.Options.SignIn.RequireConfirmedEmail || existingUser.EmailConfirmed)
            {
                // Found an existing user with the same email (require confirmed emails when the system is configured that way).  Go ahead and
                // automatically link the Azure AD account.

                // Make sure that the existing user associated with the Graph user is the same as the user that made the HTTP request.
                Guid? currentUserid = await CurrentUser.GetUserId().ConfigureAwait(false);
                if (currentUserid != null && existingUser.Id != currentUserid) throw new InvalidOperationException("Cannot link to existing application account because the email address associated with the new Azure AD identity has been taken by a different application user.");
                else dbUser = existingUser;

                // Mark the email address as confirmed, because we are trusting that Microsoft has performed this step.
                // This will only actually be changing the EmailConfirmed state from false to true if ALL of the following are true:
                //      1) The user already exists.
                //      2) The system is configured to NOT require confirmed emails.
                //      3) The user's email is NOT confirmed.
                dbUser.EmailConfirmed = true;

                Database.Models.JsonFields.UserLoginAzureAdInformation userAzureAdInformation = new() {
                    DisplayName = graphUser.DisplayName,
                    GivenName = graphUser.GivenName,
                    Surname = graphUser.Surname,
                    Email = graphUser.Mail
                };

                await UserManager.UpdateAsync(dbUser).ConfigureAwait(false);
                await UserManager.AddLoginAsync(dbUser, new(SecurityConstants.Scheme.AzureAd, graphUser.Id, System.Text.Json.JsonSerializer.Serialize(userAzureAdInformation))).ConfigureAwait(false);
                await trans.CommitAsync().ConfigureAwait(false);

                Logger.LogInformation($"Registered user from Azure AD to an existing application user account.  (Microsoft Graph user Id: {graphId}).  Existing application user Id: {existingUser.Id}.");
                retval = new() { StatusCode = RegisterStatusCodeType.Success, UserId = dbUser.Id };
            }
            else if (!existingUser.EmailConfirmed)
            {
                // Found an existing user that has the same email.  However we can't automatically link to the Azure AD account because
                // the email account has not yet been confirmed.
                Logger.LogWarning($"Unable to register user from Azure AD because the associated email address is already in use by another account.  (Microsoft Graph user Id: {graphId}).  Existing application user Id: {existingUser.Id}.  Email: {email}.");
                retval = new() { StatusCode = RegisterStatusCodeType.EmailTakenUnverified, UserId = null };  // Don't return the application user Id because it's possible for this to be some sort of attempt to enumerate the list of registered users.
            }
            else
            {
                throw new Exception($"Unable to register Azure AD user for unknown reasons.  (Microsoft Graph user Id: {graphId}).");
            }
        }
        else
        {
            // The Azure AD user has already been registered.  Nothing needs to be done.
            Logger.LogInformation($"Azure AD user was previously registered.  (Microsoft Graph user Id: {graphId}).  Existing application user Id: {dbUser.Id}.");

            // Registration failed, but only because the Azure AD user was already registered and linked to an application user account.
            // Indicate that the registration failed, but we can at least provide the application user Id to the caller.  It's safe to
            // return the application user Id associated with the Azure AD user because they were already registered and verified.
            retval = new() { StatusCode = RegisterStatusCodeType.AlreadyRegistered, UserId = dbUser.Id };
        }

        return retval;
    }
}
