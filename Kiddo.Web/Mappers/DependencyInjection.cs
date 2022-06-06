using Kiddo.Web.Configuration;

namespace Kiddo.Web.Mappers;

public static class DependencyInjection
{
    public static void AddCustomMappers(this IServiceCollection services)
    {
        // Add AutoMapper methods for basic conversion between various layer DTOs.  This will handle simple properties like integers, strings, etc.  Value types like
        // lists and objects need higher order methods to help ensure that only intended values are copied.  These higher order methods can be found in the Mappers folder.
        // Additionally, certain fields need to be manually assigned from the BL when converting from WebContract to database models.  For example DateAddedUtc timestamps
        // shouldn't be copied from the API caller.
        services.AddAutoMapper(config => {
            config.CreateMap<Kiddo.Database.Models.LookupType, Kiddo.WebContract.LookupType.LookupType>().ForMember(l => l.Lookups, op => op.Ignore());
            config.CreateMap<Kiddo.Database.Models.Lookup, Kiddo.WebContract.LookupType.Lookup>();
            config.CreateMap<Kiddo.WebContract.LookupType.Lookup, Kiddo.Database.Models.Lookup>();
            config.CreateMap<Kiddo.Database.Models.Entry, Kiddo.WebContract.Entry.Entry>();
            config.CreateMap<Kiddo.WebContract.Entry.Entry, Kiddo.Database.Models.Entry>().ForMember(e => e.DateAddedUtc, op => op.Ignore()).ForMember(e => e.UserId, op => op.Ignore());
            config.CreateMap<Kiddo.Database.Models.User, Kiddo.WebContract.User.SearchUser>().ForMember(e => e.UserId, op => op.MapFrom(source => source.Id));
            config.CreateMap<Kiddo.Database.Models.User, Kiddo.WebContract.User.User>().ForMember(e => e.UserId, op => op.MapFrom(source => source.Id));
            config.CreateMap<Kiddo.WebContract.User.User, Kiddo.Database.Models.User>().ForMember(e => e.Id, op => op.MapFrom(source => source.UserId));
            config.CreateMap<Kiddo.DAL.QueryModels.AccountCurrencySummary, Kiddo.WebContract.Account.AccountCurrencySummary>();
            config.CreateMap<Kiddo.Database.Models.Account, Kiddo.WebContract.Account.Account>();
            config.CreateMap<Kiddo.WebContract.Account.Account, Kiddo.Database.Models.Account>();
            config.CreateMap<Kiddo.Database.Models.Account, Kiddo.WebContract.Account.SearchAccountResult>();
            config.CreateMap<SpaOptions, Kiddo.WebContract.App.SpaConfiguration>();
            config.CreateMap<Kiddo.Database.Models.User, Kiddo.WebContract.Profile.Profile>().ForMember(e => e.UserId, op => op.MapFrom(source => source.Id)).ForMember(e => e.IsEmailConfirmed, op => op.MapFrom(source => source.EmailConfirmed));
            config.CreateMap<Kiddo.Database.Models.UserAzureAd, Kiddo.WebContract.AzureAd.AccountLink>();
            config.CreateMap<Microsoft.AspNetCore.Identity.PasswordOptions, Kiddo.WebContract.Identity.PasswordValidationRules>();
            config.CreateMap<Microsoft.AspNetCore.Identity.IdentityError, Kiddo.WebContract.Identity.IdentityError>();
        });
    }
}
