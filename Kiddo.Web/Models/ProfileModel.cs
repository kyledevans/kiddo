namespace Kiddo.Web.Models;

using AutoMapper;
using Kiddo.Web.Configuration;
using Kiddo.Web.Security;
using Kiddo.WebContract.Profile;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Microsoft.Identity.Web;
using MimeKit;
using System.Reflection;

public class ProfileModel
{
    private DAL.KiddoDAL DB { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private IMapper Mapper { get; set; }
    private ICurrentUserProvider CurrentUser { get; set; }
    private IAuthorizationService AuthorizationService { get; set; }
    private HttpContext HttpContext { get; set; }
    private UserManager<Database.Models.User> UserManager { get; set; }
    private IOptionsMonitor<SmtpOptions> SmtpOptions { get; set; }
    private SpaOptions SpaConfig { get; set; }
    private Validators Validators { get; set; }

    public ProfileModel(Validators validators, UserManager<Database.Models.User> userManager, DAL.KiddoDAL db, DAL.UserDAL userDB, IMapper mapper, ICurrentUserProvider currentUser, IAuthorizationService authorizationService, IHttpContextAccessor httpContextAccessor, IOptionsMonitor<SmtpOptions> smtpOptions, IOptionsMonitor<SpaOptions> spaConfigurationMonitor)
    {
        DB = db;
        UserDB = userDB;
        Mapper = mapper;
        CurrentUser = currentUser;
        AuthorizationService = authorizationService;
        UserManager = userManager;
        SmtpOptions = smtpOptions;
        SpaConfig = spaConfigurationMonitor.CurrentValue;
        Validators = validators;

        if (httpContextAccessor.HttpContext == null) throw new InvalidOperationException("HttpContext is null which indicates a call without an active Http request.");
        HttpContext = httpContextAccessor.HttpContext;
    }

    public async Task<PolicySummary> GetAuthorizationPolicies()
    {
        PolicySummary retval = new();

        retval.IsSuperAdministrator = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.SuperAdministrator).ConfigureAwait(false)).Succeeded;
        retval.IsAdministrator = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.Administrator).ConfigureAwait(false)).Succeeded;
        retval.IsUser = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.User).ConfigureAwait(false)).Succeeded;
        retval.IsReadOnlyUser = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.ReadOnlyUser).ConfigureAwait(false)).Succeeded;
        retval.IsAzureAd = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.AzureAd).ConfigureAwait(false)).Succeeded;
        retval.IsAspNetIdentity = (await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.AspNetIdentity).ConfigureAwait(false)).Succeeded;

        return retval;
    }

    public async Task<WebContract.Profile.Profile?> GetProfile()
    {
        if (!(await AuthorizationService.AuthorizeAsync(HttpContext.User, Web.Security.SecurityConstants.Policy.ReadOnlyUser).ConfigureAwait(false)).Succeeded) return null;

        Guid? userId = await CurrentUser.GetUserId().ConfigureAwait(false);

        // User is not registered.
        if (userId == null) return null;

        Database.Models.User dbUser = await UserDB.GetUser((Guid)userId).ConfigureAwait(false);

        WebContract.Profile.Profile profile = Mapper.Map<Database.Models.User, WebContract.Profile.Profile>(dbUser);
        profile.HasPassword = await UserManager.HasPasswordAsync(dbUser).ConfigureAwait(false);

        // TODO: Delete the policy stuff from here.
        profile.Policies.IsSuperAdministrator = (await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator)).ConfigureAwait(false)).Succeeded;
        profile.Policies.IsAdministrator = (await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Kiddo.Constants.SecurityRoleType.Administrator)).ConfigureAwait(false)).Succeeded;
        profile.Policies.IsUser = (await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Kiddo.Constants.SecurityRoleType.User)).ConfigureAwait(false)).Succeeded;
        profile.Policies.IsReadOnlyUser = (await AuthorizationService.AuthorizeAsync(HttpContext.User, nameof(Kiddo.Constants.SecurityRoleType.ReadOnlyUser)).ConfigureAwait(false)).Succeeded;
        profile.Policies.IsAzureAd = (await AuthorizationService.AuthorizeAsync(HttpContext.User, "AzureAd").ConfigureAwait(false)).Succeeded;
        profile.Policies.IsAspNetIdentity = (await AuthorizationService.AuthorizeAsync(HttpContext.User, "AspNetIdentity").ConfigureAwait(false)).Succeeded;

        return profile;
    }

    public async Task<WebContract.Profile.Profile> UpdateProfile(WebContract.Profile.Profile update)
    {
        using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        Guid userId = await CurrentUser.GetUserIdRequired().ConfigureAwait(false);
        Database.Models.User dbUser = await UserDB.GetUser(userId).ConfigureAwait(false);

        // Only allow users to modify a subset of their available properties.  Other fields are reserved for admins or are managed by other mechanisms.
        bool isUsernameChanged = dbUser.UserName != update.Email;   // Use strict equality comparison, also we are intentionally using the email as the username.  Makes it easier for people to remember their credentials.
        bool isEmailChanged = dbUser.Email != update.Email;

        if (isUsernameChanged)
        {
            Database.Models.User? existingUser = await UserManager.FindByNameAsync(update.Email).ConfigureAwait(false);
            if (existingUser != null && existingUser.Id != dbUser.Id) throw new Exception("Cannot update user because the new username is taken by a different account.");
        }

        if (isEmailChanged)
        {
            Database.Models.User? existingUser = await UserManager.FindByEmailAsync(update.Email).ConfigureAwait(false);
            if (existingUser != null && existingUser.Id != dbUser.Id) throw new Exception("Cannot update user because the new email is taken by a different account.");
        }

        dbUser.UserName = update.Email;
        dbUser.Email = update.Email;
        dbUser.DisplayName = update.DisplayName;
        dbUser.GivenName = update.GivenName;
        dbUser.Surname = update.Surname;
        dbUser.Email = update.Email;

        // Need to update the normalized fields so that the Identity framework can continue to function as expected.
        if (isUsernameChanged) await UserManager.UpdateNormalizedUserNameAsync(dbUser).ConfigureAwait(false);
        if (isEmailChanged) await UserManager.UpdateNormalizedEmailAsync(dbUser).ConfigureAwait(false);

        IdentityResult updateResult = await UserManager.UpdateAsync(dbUser).ConfigureAwait(false);

        if (!updateResult.Succeeded) throw new Exception("Unable to update user.");

        await trans.CommitAsync().ConfigureAwait(false);
        List<Database.Models.UserAzureAd> dbUserAzureAds = await UserDB.GetUserAzureAds(userId).ConfigureAwait(false);

        WebContract.Profile.Profile profile = Mapper.Map<Database.Models.User, WebContract.Profile.Profile>(dbUser);

        return profile;
    }

    public async Task SendConfirmationEmail(string email)
    {
        Database.Models.User? dbUser = await UserManager.FindByEmailAsync(email).ConfigureAwait(false);

        if (dbUser == null) throw new Exception("it's null Jim");

        string confirmToken = await UserManager.GenerateEmailConfirmationTokenAsync(dbUser).ConfigureAwait(false);
        Uri confirmLink = new($"{SpaConfig.Url}email-confirmation?token={Uri.EscapeDataString(confirmToken)}");

        SmtpOptions options = SmtpOptions.CurrentValue;
        MimeMessage message = new();
        message.From.Add(new MailboxAddress("Email Confirmation", options.FromEmail));
        message.To.Add(new MailboxAddress(dbUser.DisplayName, email));
        message.Subject = "Please confirm email";
        message.Body = new TextPart(MimeKit.Text.TextFormat.Html) {
            Text = $@"
<a href='{confirmLink}'>Click Here</a>"
        };

        using MailKit.Net.Smtp.SmtpClient emailClient = new();

        await emailClient.ConnectAsync(options.Host, options.Port).ConfigureAwait(false);
        await emailClient.SendAsync(message).ConfigureAwait(false);
        await emailClient.DisconnectAsync(true).ConfigureAwait(false);
    }

    public async Task<ConfirmEmailResponse> ConfirmEmail(string? email, string token)
    {
        Database.Models.User? dbUser;
        Guid? userId = await CurrentUser.GetUserId().ConfigureAwait(false);

        if (userId != null)
        {
            dbUser = await UserDB.GetUser(await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);
        }
        else if (!String.IsNullOrWhiteSpace(email))
        {
            dbUser = await UserManager.FindByEmailAsync(email).ConfigureAwait(false);
        }
        else
        {
            // If the user isn't logged in and they didn't provide an email address, then we can't proceed and need to throw an exception.
            throw new ArgumentNullException(nameof(email));
        }

        IdentityResult confirmResult = await UserManager.ConfirmEmailAsync(dbUser, token).ConfigureAwait(false);
        ConfirmEmailResponse retval = new()
        {
            Success = confirmResult.Succeeded
        };
        return retval;
    }

    public async Task<WebContract.ValidationResponse> ValidateEmailForRegistration(string email)
    {
        WebContract.ValidationResponse retval = new();
        retval.IsValid = Validators.IsStorableUserNameAndEmail(email);

        if (!retval.IsValid)
        {
            retval.ErrorCode = "InvalidEmail";
            return retval;
        }

        retval.IsValid = await UserManager.FindByEmailAsync(email).ConfigureAwait(false) == null;

        if (!retval.IsValid)
        {
            retval.ErrorCode = "EmailTaken";
            return retval;
        }

        return retval;
    }
}
