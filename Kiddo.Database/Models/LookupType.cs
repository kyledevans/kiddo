namespace Kiddo.Database.Models;

public class LookupType
{
    public LookupType()
    {
        Lookups = new HashSet<Lookup>();
    }

    public int LookupTypeId { get; set; }
#nullable disable
    public string Name { get; set; }
    public string Description { get; set; }
#nullable restore
    public int SortOrder { get; set; }

    public virtual ICollection<Lookup> Lookups { get; set; }
}
