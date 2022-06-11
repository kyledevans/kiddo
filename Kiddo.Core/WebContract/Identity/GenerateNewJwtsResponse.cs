namespace Kiddo.WebContract.Identity;

public class GenerateNewJwtsResponse
{
    public string RefreshToken { get; set; } = String.Empty;
    public string AccessToken { get; set; } = String.Empty;
}
