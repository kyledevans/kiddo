namespace Kiddo.Database.Models;

public class Entry
{
    public int EntryId { get; set; }
    public int CurrencyLookupId { get; set; }
    public int AccountId { get; set; }
    public Guid UserId { get; set; }
    public DateTime DateAddedUtc { get; set; }
    public int Value { get; set; }

#nullable disable
    public Account Account { get; set; }
    public Lookup CurrencyLookup { get; set; }
    public User User { get; set; }
#nullable restore
}
