namespace Kiddo.Web.Abstractions;

public interface ICurrentUserProvider
{
    Task Initialize(bool forceRefresh = false);
    Task<string?> GetAzureAdIdentifier();
    Task<Guid?> GetAspNetIdentifier();
    Task<Guid> GetUserIdRequired();
    Task<Guid?> GetUserId();
}
