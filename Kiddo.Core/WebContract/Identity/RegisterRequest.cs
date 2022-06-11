namespace Kiddo.WebContract.Identity;

public class RegisterRequest
{
    public string Email { get; set; } = String.Empty;
    public string Password { get; set; } = String.Empty;
    public string DisplayName { get; set; } = String.Empty;
    public string GivenName { get; set; } = String.Empty;
    public string Surname { get; set; } = String.Empty;
}
