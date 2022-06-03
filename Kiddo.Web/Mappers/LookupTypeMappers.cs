namespace Kiddo.Web.Mappers;

using AutoMapper;

public static class LookupTypeMappers
{
    public static WebContract.LookupType.LookupType DB_LookupType_Web_LookupType(this IMapper mapper, Database.Models.LookupType dbType, List<Database.Models.Lookup> dbLookups)
    {
        WebContract.LookupType.LookupType retval = mapper.Map<Database.Models.LookupType, WebContract.LookupType.LookupType>(dbType);
        retval.Lookups = mapper.Map<List<Database.Models.Lookup>, List<WebContract.LookupType.Lookup>>(dbLookups);
        return retval;
    }
}
