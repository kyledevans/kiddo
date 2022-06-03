namespace Kiddo.Database.Models;

public class Account
{
    public Account()
    {
        Entries = new HashSet<Entry>();
    }

    public int AccountId { get; set; }
#nullable disable
    public string Name { get; set; }
    public string NameShort { get; set; }
#nullable restore
    public string? Description { get; set; }

    public ICollection<Entry> Entries { get; set; }
}
