namespace Kiddo.WebContract.AzureAd;

public class RegisterResponse
{
    public RegisterStatusCodeType StatusCode { get; set; }
    public Guid? UserId { get; set; }
    public RegisterPrefillData? PrefillData { get; set; }
}
