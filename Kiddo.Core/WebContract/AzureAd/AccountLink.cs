﻿namespace Kiddo.WebContract.AzureAd;

#nullable enable annotations

public class AccountLink
{
    public int UserAzureAdId { get; set; }
    public string GraphId { get; set; } = String.Empty;
    public string DisplayName { get; set; } = String.Empty;
    public string GivenName { get; set; } = String.Empty;
    public string Surname { get; set; } = String.Empty;
    public string Email { get; set; } = String.Empty;
}
