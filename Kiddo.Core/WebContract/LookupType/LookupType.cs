namespace Kiddo.WebContract.LookupType;

public class LookupType
{
    public int LookupTypeId { get; set; }
    public string Name { get; set; } = String.Empty;
    public string Description { get; set; } = String.Empty;
    public int SortOrder { get; set; }
    public List<Lookup> Lookups { get; set; } = new();
}
