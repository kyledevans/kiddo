namespace Kiddo.WebContract.Entry;

#nullable enable annotations

public class Entry
{
    public int EntryId { get; set; }
    public int AccountId { get; set; }
    public int CurrencyLookupId { get; set; }
    public Guid UserId { get; set; }
    public DateTime DateAddedUtc { get; set; }
    public int Value { get; set; }
}
