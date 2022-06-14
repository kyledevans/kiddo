namespace Kiddo.Web.Models;

using Kiddo.Web.Configuration;
using Microsoft.Extensions.Options;
using MimeKit;

public class EmailSender
{
    private IOptionsMonitor<SmtpOptions> SmtpOptions { get; set; }

    public EmailSender(IOptionsMonitor<SmtpOptions> smtpOptions)
    {
        SmtpOptions = smtpOptions;
    }

    public async Task<bool> SendEmail(string toEmailTitle, string toEmail, string fromEmailTitle, string subject, string messageBody)
    {
        try
        {
            SmtpOptions options = SmtpOptions.CurrentValue;
            MimeMessage message = new();
            message.From.Add(new MailboxAddress(fromEmailTitle, options.FromEmail));
            message.To.Add(new MailboxAddress(toEmailTitle, toEmail));
            message.Subject = subject;
            message.Body = new TextPart(MimeKit.Text.TextFormat.Html) {
                Text = messageBody
            };

            using MailKit.Net.Smtp.SmtpClient? emailClient = new();

            await emailClient.ConnectAsync(options.Host, options.Port).ConfigureAwait(false);
            await emailClient.SendAsync(message).ConfigureAwait(false);
            await emailClient.DisconnectAsync(true).ConfigureAwait(false);

            return true;
        }
        catch
        {
            return false;
        }
    }
}
