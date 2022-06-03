namespace Kiddo.WebContract.AzureAd;

#nullable enable annotations

public class RegisterResponse
{
    public RegisterStatusCodeType StatusCode { get; set; }
    public Guid? UserId { get; set; }
    public RegisterPrefillData? PrefillData { get; set; }
}
