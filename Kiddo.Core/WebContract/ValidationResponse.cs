namespace Kiddo.WebContract;

#nullable enable annotations

public class ValidationResponse
{
    public bool IsValid { get; set; }
    public string? ErrorCode { get; set; }
}
