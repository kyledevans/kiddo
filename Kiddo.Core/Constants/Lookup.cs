namespace Kiddo.Constants;

/// <summary>
/// Miscellaneous constant values against the Lookup table.
/// </summary>
public static class Lookup
{
    /// <summary>
    /// Zero record.  Used when we need an optional foreign key reference to a Lookup.  This allows for referential integrity to be enforced at the
    /// database level.  There are alternative ways to handle optional FK references which should be considered.  Such as simply allowing a FK to be
    /// nullable and disable check constraints, add an xref table along with some unique constraints, or something entirely different.
    /// </summary>
    public const int Zero = 0;

    /// <summary>
    /// The first LookupId that is allowed to contain user-defined data.  Any Lookup records with an Id less than this is considered "internal" to the
    /// application, and is not allowed to be modified.
    /// </summary>
    public const int InitialLookupId = 1000;
}
