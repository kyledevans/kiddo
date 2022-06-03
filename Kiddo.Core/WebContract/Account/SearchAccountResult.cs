namespace Kiddo.WebContract.Account;

#nullable enable annotations

public class SearchAccountResult
{
    public int AccountId { get; set; }
    public string Name { get; set; } = String.Empty;
    public string NameShort { get; set; } = String.Empty;
    public string? Description { get; set; }
    public List<AccountCurrencySummary> Currencies { get; set; } = new();
}

