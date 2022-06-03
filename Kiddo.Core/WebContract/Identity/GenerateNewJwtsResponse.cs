namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class GenerateNewJwtsResponse
{
    public string RefreshToken { get; set; } = String.Empty;
    public string AccessToken { get; set; } = String.Empty;
}
