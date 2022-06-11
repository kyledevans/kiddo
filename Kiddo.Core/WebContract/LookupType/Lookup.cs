namespace Kiddo.WebContract.LookupType;

public class Lookup
{
    public int LookupId { get; set; }
    public string Name { get; set; } = String.Empty;
    public string NameShort { get; set; } = String.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
