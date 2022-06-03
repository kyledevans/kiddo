namespace Kiddo.Web.Security;

using Microsoft.Graph;

/// <summary>
/// Provide MS Graph client when the caller provided MSAL access token cannot be retrieved
/// from HTTP request headers.  For example if a request uses auth scheme "Foo" in the
/// Authorize header, and the MSAL token is provided within the request body somewhere.
/// 
/// This interface allows manually specifying the MSAL access token.
/// </summary>
public interface IManualGraphServiceClient
{
    GraphServiceClient GetClient(string manualAccessToken);
}
