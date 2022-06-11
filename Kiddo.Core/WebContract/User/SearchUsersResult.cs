namespace Kiddo.WebContract.User;

public class SearchUsersResult
{
    public List<SearchUser> Users { get; set; } = new();
    public bool IsOverMax { get; set; }
}
