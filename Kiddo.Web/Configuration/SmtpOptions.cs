namespace Kiddo.Web.Configuration;

#nullable enable annotations

public class SmtpOptions
{
    public string? Host { get; set; }
    public int Port { get; set; } = 25;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? FromEmail { get; set; }
}
