namespace Kiddo.WebContract.User;

#nullable enable annotations

public class SearchUser
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = String.Empty;
}
