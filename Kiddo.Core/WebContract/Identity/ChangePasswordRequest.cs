namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = String.Empty;
    public string NewPassword { get; set; } = String.Empty;
}
