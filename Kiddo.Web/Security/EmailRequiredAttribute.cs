namespace Kiddo.Web.Security;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class EmailRequiredAttribute : Attribute
{
    // This is a marker attribute.  The actual logic that enforces this is in EmailRequiredMiddleware.
}
