using System.Diagnostics.CodeAnalysis;

namespace Kiddo.Web.Models;

public class Validators
{
    private DAL.UserDAL UserDB { get; set; }

    public Validators(DAL.UserDAL userDB)
    {
        UserDB = userDB;
    }

    public bool IsStorableDisplayName(string? displayName)
    {
        int maxLength = UserDB.GetMaxDisplayNameLength();
        return displayName == null || displayName.Length < maxLength;
    }

    public bool IsStorableGivenName(string? firstName)
    {
        int maxLength = UserDB.GetMaxGivenNameLength();
        return firstName == null || firstName.Length < maxLength;
    }

    public bool IsStorableSurname(string? surname)
    {
        int maxLength = UserDB.GetMaxSurnameLength();
        return surname == null || surname.Length < maxLength;
    }

    public bool IsStorableUserNameAndEmail(string email)
    {
        if (!IsParseableEmail(email)) return false;

        int maxUserNameLength = UserDB.GetMaxUserNameLength();
        int maxEmailLength = UserDB.GetMaxEmailLength();

        int maxLength = Math.Min(maxUserNameLength, maxEmailLength);

        return email.Length < maxLength;
    }

    public static bool IsParseableEmail([NotNullWhen(true)] string? email)
    {
        if (String.IsNullOrWhiteSpace(email)) return false;

        if (email.EndsWith("."))
        {
            return false;
        }
        try
        {
            System.Net.Mail.MailAddress addr = new(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
