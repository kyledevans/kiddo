namespace Kiddo.Constants;

/// <summary>
/// LookupType types.  Backing value (integer) contains the LookupTypeId for each type.
/// </summary>
public enum LookupTypeType
{
    /// <summary>
    /// Zero record.  Used when we need an optional foreign key reference to a Lookup.  This allows for referential integrity to be enforced at the
    /// database level.  There are alternative ways to handle optional FK references which should be considered.  Such as simply allowing a FK to be
    /// nullable and disable check constraints, add an xref table along with some unique constraints, or something entirely different.
    /// </summary>
    Zero = 0,

    /// <summary>
    /// Currency.
    /// </summary>
    Currency = 1,

    /// <summary>
    /// Application security roles.
    /// </summary>
    SecurityRole = 2
}
