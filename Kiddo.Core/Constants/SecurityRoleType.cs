namespace Kiddo.Constants;

public enum SecurityRoleType
{
    SuperAdministrator = 1,
    Administrator = 2,
    User = 3,
    ReadOnlyUser = 4
}

public static class SecurityRoleTypeDefaultId
{
    /// <summary>
    /// 9a08008c-ae21-4a52-b31e-c27060cf0318
    /// </summary>
    public static readonly Guid SuperAdministrator = new("9a08008c-ae21-4a52-b31e-c27060cf0318");

    /// <summary>
    /// 67876a07-bc53-4c05-9c01-3c8ca59fca21
    /// </summary>
    public static readonly Guid Administrator = new("67876a07-bc53-4c05-9c01-3c8ca59fca21");

    /// <summary>
    /// f6e96595-1db8-48dc-9786-445ce6d3552c
    /// </summary>
    public static readonly Guid User = new("f6e96595-1db8-48dc-9786-445ce6d3552c");

    /// <summary>
    /// 84007924-2a1f-40d7-9c70-4eb07754bc36
    /// </summary>
    public static readonly Guid ReadOnlyUser = new("84007924-2a1f-40d7-9c70-4eb07754bc36");
}

