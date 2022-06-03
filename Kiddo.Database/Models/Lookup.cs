namespace Kiddo.Database.Models;

public class Lookup
{
    public Lookup()
    {
        CurrencyEntries = new HashSet<Entry>();
    }

    public int LookupId { get; set; }
    public int LookupTypeId { get; set; }
#nullable disable
    public string Name { get; set; }
    public string NameShort { get; set; }
#nullable restore
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }

#nullable disable
    public LookupType LookupType { get; set; }
#nullable restore
    public ICollection<Entry> CurrencyEntries { get; set; }
}
