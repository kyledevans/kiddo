namespace Kiddo.Web.Security.Selector;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class AuthenticationMethodEnabledAttribute : Attribute
{
    public WebContract.AuthenticationMethodType AuthenticationMethod { get; set; }

    public AuthenticationMethodEnabledAttribute(WebContract.AuthenticationMethodType authenticationMethod)
    {
        AuthenticationMethod = authenticationMethod;
    }
}
