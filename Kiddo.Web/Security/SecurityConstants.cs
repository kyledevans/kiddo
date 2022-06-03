namespace Kiddo.Web.Security;

public static class SecurityConstants
{
    public static class Scheme
    {
        public const string Selector = "Selector";
        public const string AspNetIdentity = "AspNetIdentity";
        public const string AzureAd = "AzureAd";
    }

    public static class Policy
    {
        /// <summary>
        /// User is authenticated with Azure AD.  IMPORTANT: This does NOT mean the user is registered in the application.  All it indicates
        /// is that we can trust in the identity supplied by the Azure AD JWT.
        /// </summary>
        public const string AzureAd = "AzureAd";
        public const string AspNetIdentity = "AspNetIdentity";
        public const string AspNetIdentityAccess = "AspNetIdentity.Access";
        public const string AspNetIdentityRefresh = "AspNetIdentity.Refresh";
        public const string SuperAdministrator = nameof(Kiddo.Constants.SecurityRoleType.SuperAdministrator);
        public const string Administrator = nameof(Kiddo.Constants.SecurityRoleType.Administrator);
        public const string User = nameof(Kiddo.Constants.SecurityRoleType.User);
        public const string ReadOnlyUser = nameof(Kiddo.Constants.SecurityRoleType.ReadOnlyUser);
    }

    public static class ClaimType
    {
        public const string Issuer = "iss";
        public const string Audience = "aud";
    }

    public static class AspNetIdentity
    {
        public static readonly string Issuer = System.Reflection.Assembly.GetExecutingAssembly().GetName().Name ?? "AspNetIdentity";
        public static readonly string AccessTokenAudience = Issuer + ".Access";
        public static readonly string RefreshTokenAudience = Issuer + ".Refresh";

        /// <summary>
        /// appsettings.json section for password authentication configuration.
        /// </summary>
        public const string PasswordOptions = "Password";

        /// <summary>
        /// appsettings.json section for password authentication JWT signing key.
        /// </summary>
        public const string SecurityKeyOptions = "Password:SecurityKey";
    }

    public static class AzureAd
    {
        /// <summary>
        /// The issuer for Microsoft Identity Platform JWTs will begin with this string.  The remaining portion of the issuer can vary depending on country, tenant, etc.
        /// </summary>
        public const string IssuerPrefix = "https://login.microsoftonline.com/";

        /// <summary>
        /// appsettings.json section for the SPA client MSAL.
        /// </summary>
        public const string SpaAzureAdOptions = "SpaAzureAd";

        /// <summary>
        /// appsettings.json section for the backend API to authenticate users against MSAL.
        /// </summary>
        public const string ApiAzureAdOptions = "ApiAzureAd";

        /// <summary>
        /// appsettings.json section for the backend API to perform direct queries to the Microsoft Graph service.
        /// </summary>
        public const string ApiGraphOptions = "ApiGraph";
    }
}
