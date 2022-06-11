namespace Kiddo.WebContract.App;

public class ApplicationInfo
{
    public Guid UserId { get; set; }
    public string Version { get; set; } = String.Empty;
    public string DisplayName { get; set; } = String.Empty;
}
