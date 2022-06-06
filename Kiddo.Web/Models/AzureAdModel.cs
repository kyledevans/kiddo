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
        List<Database.Models.UserAzureAd> dbUserAzureAds = await UserDB.GetUserAzureAds(userId).ConfigureAwait(false);
        List<AccountLink> retval = Mapper.Map<List<Database.Models.UserAzureAd>, List<AccountLink>>(dbUserAzureAds);
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

    public async Task RemoveLink(int userAzureAdId)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);
        List<Database.Models.UserAzureAd> dbUserAzureAds = await UserDB.GetUserAzureAds(await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);

        Database.Models.UserAzureAd? dbAzure = dbUserAzureAds.Where(usaad => usaad.UserAzureAdId == userAzureAdId).FirstOrDefault();

        if (dbAzure == null) throw new Exception("Unable to find the Azure AD link for the current user.");

        await UserDB.DeleteUserAzureAd(dbAzure).ConfigureAwait(false);
        await trans.CommitAsync().ConfigureAwait(false);
    }

    public async Task<RegisterResponse> Register(RegisterRequest? manualEntry, string? manualAccessToken)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        Database.Models.UserAzureAd? dbUserAzureAd;
        Database.Models.User? dbUser;
        string graphId;
        User graphUser;
        RegisterResponse retval;
        string? displayName, givenName, surname, email; // Contains values provided by manualEntry parameter or the values retrieved directly from Azure AD.
        Database.Models.User? existingUser;

        // Retrieve information from Microsoft Graph.
        (graphId, graphUser) = await GetUserGraphInformation(manualAccessToken).ConfigureAwait(false);

        dbUserAzureAd = await UserDB.GetUserAzureAdByGraphId(graphId).ConfigureAwait(false);

        // Get the application user if possible.
        if (dbUserAzureAd == null)
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

                dbUserAzureAd = new() {
                    GraphId = graphId,
                    DisplayName = displayName.Trim(),
                    GivenName = givenName.Trim(),
                    Surname = surname.Trim(),
                    Email = email.Trim()
                };

                Kiddo.Constants.SecurityRoleType? initialRole = await RegistrationBehavior.GetInitialRole().ConfigureAwait(false);
                if (initialRole == null) throw new Exception("initialRole cannot be null.");

                await UserManager.CreateAsync(dbUser).ConfigureAwait(false);
                dbUserAzureAd.UserId = dbUser.Id;
                await UserDB.InsertUserAzureAd(dbUserAzureAd).ConfigureAwait(false);
                await UserManager.AddToRoleAsync(dbUser, initialRole.ToString()).ConfigureAwait(false);
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

                dbUserAzureAd = new() {
                    GraphId = graphId,
                    DisplayName = displayName.Trim(),
                    GivenName = givenName.Trim(),
                    Surname = surname.Trim(),
                    Email = (email ?? "").Trim(),
                    UserId = existingUser.Id
                };

                await UserManager.UpdateAsync(dbUser).ConfigureAwait(false);
                await UserDB.InsertUserAzureAd(dbUserAzureAd).ConfigureAwait(false);
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
            Logger.LogInformation($"Azure AD user was previously registered.  (Microsoft Graph user Id: {graphId}).  Existing application user Id: {dbUserAzureAd.UserId}.");

            // Registration failed, but only because the Azure AD user was already registered and linked to an application user account.
            // Indicate that the registration failed, but we can at least provide the application user Id to the caller.  It's safe to
            // return the application user Id associated with the Azure AD user because they were already registered and verified.
            retval = new() { StatusCode = RegisterStatusCodeType.AlreadyRegistered, UserId = dbUserAzureAd.UserId };
        }

        return retval;
    }

    public async Task EnsureProfile()
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        string? graphId = await CurrentUser.GetAzureAdIdentifier().ConfigureAwait(false);

        if (graphId == null) throw new InvalidOperationException("Cannot proceed because the current user's Microsoft Graph Id was not discovered.");

        Database.Models.UserAzureAd? dbUserAzureAd = await UserDB.GetUserAzureAdByGraphId(graphId).ConfigureAwait(false);
        Database.Models.User dbUser;
        User? graphUser = await GraphClient.Me.Request().WithAuthenticationScheme(Web.Security.SecurityConstants.Scheme.AzureAd).GetAsync().ConfigureAwait(false);
        string? cleansedEmail;

        if (graphUser == null) throw new Exception($"Unable to retrieve user record from Microsoft Graph API (Microsoft Graph user Id: {graphId}).");

        // For simplicity we are going to only import email addresses that we are actually able to use.
        if (String.IsNullOrWhiteSpace(graphUser.Mail))
        {
            cleansedEmail = null;
            Logger.LogInformation($"Email address synchronization has been set to null because the value retrieved from the Microsoft Graph API is empty (Microsoft Graph user Id: {graphId}).");
        }
        else if (!Validators.IsParseableEmail(graphUser.Mail))
        {
            Logger.LogWarning($"Email address synchronization has been set to null because the value retrieved from the Microsoft Graph API does not pass validation (Microsoft Graph user Id: {graphId}).");
            cleansedEmail = null;
        }
        else
        {
            cleansedEmail = graphUser.Mail.Trim();
        }

        // Perform the necessary synchronization.
        if (dbUserAzureAd == null)
        {
            // New user.  Create relevant entries.
            dbUserAzureAd = new() {
                GraphId = graphId,
                DisplayName = graphUser.DisplayName,
                GivenName = graphUser.GivenName,
                Surname = graphUser.Surname,
                Email = cleansedEmail
            };

            dbUser = new() {
                UserName = graphId,
                DisplayName = graphUser.DisplayName,
                GivenName = graphUser.GivenName,
                Surname = graphUser.Surname,
                Email = cleansedEmail
            };

            IdentityResult createResult = await UserManager.CreateAsync(dbUser).ConfigureAwait(false);

            if (createResult.Succeeded)
            {
                dbUserAzureAd.UserId = dbUser.Id;
                await UserDB.InsertUserAzureAd(dbUserAzureAd).ConfigureAwait(false);
                await UserManager.AddToRoleAsync(dbUser, nameof(Kiddo.Constants.SecurityRoleType.ReadOnlyUser)).ConfigureAwait(false);
                await trans.CommitAsync().ConfigureAwait(false);

                Logger.LogInformation($"User created (Microsoft Graph user Id: {graphId}, application UserId: {dbUser.Id}).");
            }
            else
            {
                Exception ex = new("Unable to automatically register user.");
                ex.Data.Add($"{nameof(createResult)}", createResult);   // TODO: Need to serialize the list of errors and throw them in the exception message.
                throw ex;
            }
        }
        else
        {
            // Existing user.  Update relevant record.
            dbUserAzureAd.DisplayName = graphUser.DisplayName;
            dbUserAzureAd.GivenName = graphUser.GivenName;
            dbUserAzureAd.Surname = graphUser.Surname;
            dbUserAzureAd.Email = cleansedEmail;

            await DB.SaveChanges().ConfigureAwait(false);
            await trans.CommitAsync().ConfigureAwait(false);

            // Note: For now this is intentionally NOT updating the actual User table.  Because it's possible the user may have customized some of those values.  If we want
            // to have ongoing synchronization to this table we should probably implement some way to toggle sync on or off for each user.
        }

        // Force the system to refresh the current user provider so that other areas of the application can begin using references to the current UserId.
        await CurrentUser.Initialize(true).ConfigureAwait(false);
    }
}
