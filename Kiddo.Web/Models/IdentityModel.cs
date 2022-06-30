namespace Kiddo.Web.Models;

using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Options;
using Kiddo.Web.Security;
using Kiddo.WebContract.Identity;
using MimeKit;
using Kiddo.Web.Configuration;
using Kiddo.Web.Security.Identity;

public class IdentityModel
{
    private UserManager<Database.Models.User> UserManager { get; set; }
    private SignInManager<Database.Models.User> SignInManager { get; set; }
    private IMapper Mapper { get; set; }
    private IJwtPairGenerator JwtUtils { get; set; }
    private ICurrentUserProvider CurrentUser { get; set; }
    private DAL.UserDAL UserDB { get; set; }
    private DAL.KiddoDAL DB { get; set; }
    private IOptionsMonitor<IdentityOptions> IdentityOptionsMonitor { get; set; }
    private IUserRegistrationBehavior RegistrationBehavior { get; set; }
    private IOptionsMonitor<SmtpOptions> SmtpOptions { get; set; }
    private SpaOptions SpaConfig { get; set; }
    private EmailSender EmailSender { get; set; }

    public IdentityModel(DAL.KiddoDAL db, DAL.UserDAL userDB, UserManager<Database.Models.User> userManager, SignInManager<Database.Models.User> signInManager, IMapper mapper, IJwtPairGenerator jwtUtils, ICurrentUserProvider currentUser, IOptionsMonitor<IdentityOptions> identityOptionsMonitor, IUserRegistrationBehavior registrationBehavior, IOptionsMonitor<SmtpOptions> smtpOptions, IOptionsMonitor<SpaOptions> spaConfigurationMonitor, EmailSender emailSender)
    {
        UserDB = userDB;
        UserManager = userManager;
        SignInManager = signInManager;
        Mapper = mapper;
        JwtUtils = jwtUtils;
        CurrentUser = currentUser;
        DB = db;
        IdentityOptionsMonitor = identityOptionsMonitor;
        RegistrationBehavior = registrationBehavior;
        SmtpOptions = smtpOptions;
        SpaConfig = spaConfigurationMonitor.CurrentValue;
        EmailSender = emailSender;
    }

    public async Task<RegisterResponse> Register(string email, string password, string displayName, string givenName, string surname)
    {
        if (!await RegistrationBehavior.GetIsRegistrationAllowed().ConfigureAwait(false)) throw new Exception("Registration is not enabled.");

        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction trans = await DB.BeginTransaction().ConfigureAwait(false);

        RegisterResponse retval;

        Database.Models.User dbUser = new()
        {
            DisplayName = displayName,
            GivenName = givenName,
            Surname = surname,
            UserName = email,
            Email = email
        };

        dbUser.EmailConfirmed = await RegistrationBehavior.GetIsEmailAutoConfirmed().ConfigureAwait(false);
        Constants.SecurityRoleType? initialRole = await RegistrationBehavior.GetInitialRole().ConfigureAwait(false);
        if (initialRole == null) throw new Exception("initialRole cannot be null.");

        IdentityResult createUserResult = await UserManager.CreateAsync(dbUser).ConfigureAwait(false);

        if (!createUserResult.Succeeded)
        {
            retval = new() {
                Success = false,
                Errors = Mapper.Map<List<WebContract.Identity.IdentityError>>(createUserResult.Errors)
            };
            return retval;
        }

        IdentityResult setPasswordResult = await UserManager.AddPasswordAsync(dbUser, password).ConfigureAwait(false);

        if (!setPasswordResult.Succeeded)
        {
            retval = new() {
                Success = false,
                Errors = Mapper.Map<List<WebContract.Identity.IdentityError>>(createUserResult.Errors)
            };
            return retval;
        }

        IdentityResult addInitialRoleResult = await UserManager.AddToRoleAsync(dbUser, initialRole.ToString()).ConfigureAwait(false);

        if (!addInitialRoleResult.Succeeded)
        {
            retval = new() {
                Success = false,
                Errors = Mapper.Map<List<WebContract.Identity.IdentityError>>(createUserResult.Errors)
            };
            return retval;
        }

        await trans.CommitAsync().ConfigureAwait(false);
        bool isAutoLogin = await RegistrationBehavior.GetIsAutoLoginAllowed().ConfigureAwait(false);

        retval = new() {
            Success = true,
        };

        if (dbUser.EmailConfirmed && isAutoLogin)
        {
            retval.AuthenticateResponse = new() { Success = true, UserId = dbUser.Id };
            retval.AuthenticateResponse.RefreshToken = JwtUtils.GenerateRefreshToken(dbUser.Id);
            retval.AuthenticateResponse.AccessToken = JwtUtils.GenerateAccessToken(retval.AuthenticateResponse.RefreshToken);
        }

        if (!dbUser.EmailConfirmed)
        {
            string confirmToken = await UserManager.GenerateEmailConfirmationTokenAsync(dbUser).ConfigureAwait(false);
            Uri confirmLink = new($"{SpaConfig.Url}email-confirmation?token={Uri.EscapeDataString(confirmToken)}");
            await EmailSender.SendEmail($"Email Confirmation", dbUser.Email, "Registration Confirmation", "Registration Confirmation", $@"
<a href='{confirmLink}'>Click Here</a>").ConfigureAwait(false);
        }

        return retval;
    }

    public async Task<AuthenticateResponse> Authenticate(string userName, string password)
    {
        AuthenticateResponse retval = new();

        Database.Models.User? aspUser = await UserManager.FindByNameAsync(userName).ConfigureAwait(false);

        if (aspUser == null)
        {
            retval.Success = false;
            return retval;
        }

        // Note: The ASP framework has 2 methods for signing in a user: PasswordSignInAsync() and CheckPasswordSignInAsync().
        // Since we are using JWT bearer tokens, we MUST use CheckPasswordSignInAsync().  Because the other method is really only
        // intended to be used along with cookie based authentication.  If we were to try and call that, we would get runtime errors
        // because cookies have not been configured in the system.
        SignInResult result = await SignInManager.CheckPasswordSignInAsync(aspUser, password, true).ConfigureAwait(false);
        if (!result.Succeeded)
        {
            retval.Success = false;
            return retval;
        }

        string refreshToken = JwtUtils.GenerateRefreshToken(aspUser.Id);
        string accessToken = JwtUtils.GenerateAccessToken(refreshToken);

        retval = new()
        {
            Success = true,
            UserId = aspUser.Id,
            RefreshToken = refreshToken,
            AccessToken = accessToken
        };

        return retval;
    }

    public async Task<GenerateNewJwtsResponse> GenerateNewJwts()
    {
        Guid? aspNetUserId = await CurrentUser.GetAspNetIdentifier().ConfigureAwait(false);

        if (aspNetUserId == null) throw new Exception("Unable to generate new tokens because the aspNetUserId is null.");

        GenerateNewJwtsResponse retval = new()
        {
            RefreshToken = JwtUtils.GenerateRefreshToken((Guid)aspNetUserId)
        };
        retval.AccessToken = JwtUtils.GenerateAccessToken(retval.RefreshToken);

        return retval;
    }

    public PasswordValidationRules GetPasswordValidationRules()
    {
        PasswordOptions options = IdentityOptionsMonitor.CurrentValue.Password;

        PasswordValidationRules retval = Mapper.Map<PasswordOptions, PasswordValidationRules>(options);
        return retval;
    }

    public async Task SendPasswordReset(string email)
    {
        Database.Models.User? dbUser = await UserManager.FindByEmailAsync(email).ConfigureAwait(false);

        if (dbUser == null) throw new Exception("it's null Jim");

        string resetToken = await UserManager.GeneratePasswordResetTokenAsync(dbUser).ConfigureAwait(false);
        Uri resetLink = new($"{SpaConfig.Url}password-reset?token={Uri.EscapeDataString(resetToken)}");

        SmtpOptions options = SmtpOptions.CurrentValue;
        MimeMessage message = new();
        message.From.Add(new MailboxAddress("Password Reset", options.FromEmail));
        message.To.Add(new MailboxAddress(dbUser.DisplayName, email));
        message.Subject = "Password reset requested";
        message.Body = new TextPart(MimeKit.Text.TextFormat.Html)
        {
            Text = $@"
<a href='{resetLink}'>Click Here</a>"
        };

        using MailKit.Net.Smtp.SmtpClient? emailClient = new();

        await emailClient.ConnectAsync(options.Host, options.Port).ConfigureAwait(false);
        await emailClient.SendAsync(message).ConfigureAwait(false);
        await emailClient.DisconnectAsync(true).ConfigureAwait(false);
    }

    public async Task<PasswordResetResponse> PasswordReset(string email, string password, string token)
    {
        Database.Models.User? dbUser = await UserManager.FindByEmailAsync(email).ConfigureAwait(false);
        IdentityResult resetResult = await UserManager.ResetPasswordAsync(dbUser, token, password).ConfigureAwait(false);
        PasswordResetResponse retval = new()
        {
            Success = resetResult.Succeeded
        };
        return retval;
    }

    public async Task<bool> ChangePassword(string currentPassword, string newPassword)
    {
        Database.Models.User dbUser = await UserDB.GetUser(await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);
        IdentityResult changeResult = await UserManager.ChangePasswordAsync(dbUser, currentPassword, newPassword).ConfigureAwait(false);
        return changeResult.Succeeded;
    }

    public async Task<bool> RemovePassword()
    {
        Database.Models.User dbUser = await UserDB.GetUser(await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);
        IdentityResult removeResult = await UserManager.RemovePasswordAsync(dbUser).ConfigureAwait(false);
        return removeResult.Succeeded;
    }

    public async Task<bool> RemovePasswordByUserId(Guid userId)
    {
        Database.Models.User dbUser = await UserDB.GetUser(userId).ConfigureAwait(false);
        IdentityResult removeResult = await UserManager.RemovePasswordAsync(dbUser).ConfigureAwait(false);
        return removeResult.Succeeded;
    }

    public async Task<bool> SetPassword(string newPassword)
    {
        Database.Models.User dbUser = await UserDB.GetUser(await CurrentUser.GetUserIdRequired().ConfigureAwait(false)).ConfigureAwait(false);

        if (await UserManager.HasPasswordAsync(dbUser).ConfigureAwait(false)) return false; // Don't allow blindly setting the password if the user already has one.

        IdentityResult addResult = await UserManager.AddPasswordAsync(dbUser, newPassword).ConfigureAwait(false);

        return addResult.Succeeded;
    }

    public async Task<bool> SetPasswordByUserId(Guid userId, string newPassword)
    {
        Database.Models.User dbUser = await UserDB.GetUser(userId).ConfigureAwait(false);

        // Remove existing password if necessary.
        if (await UserManager.HasPasswordAsync(dbUser).ConfigureAwait(false))
        {
            await UserManager.RemovePasswordAsync(dbUser).ConfigureAwait(false);
        }

        IdentityResult addResult = await UserManager.AddPasswordAsync(dbUser, newPassword).ConfigureAwait(false);

        return addResult.Succeeded;
    }
}
