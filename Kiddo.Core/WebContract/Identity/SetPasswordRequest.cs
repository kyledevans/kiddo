namespace Kiddo.WebContract.Identity;

#nullable enable annotations

public class SetPasswordRequest
{
    public string NewPassword { get; set; } = String.Empty;
}
