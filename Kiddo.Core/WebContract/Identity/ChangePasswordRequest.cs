namespace Kiddo.WebContract.Identity;

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = String.Empty;
    public string NewPassword { get; set; } = String.Empty;
}
