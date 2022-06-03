namespace Kiddo.WebContract;

public class ForeignKeysException : Exception
{
    public List<int> ForeignKeys { get; private set; }

    public ForeignKeysException(List<int> foreignKeys) :
        base("Unable to delete due to foreign key reference(s).")
    {
        ForeignKeys = foreignKeys;
    }
}
