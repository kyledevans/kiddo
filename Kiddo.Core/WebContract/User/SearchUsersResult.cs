namespace Kiddo.WebContract.User;

#nullable enable annotations

public class SearchUsersResult
{
    public List<SearchUser> Users { get; set; } = new();
    public bool IsOverMax { get; set; }
}
