namespace Kiddo.Web.Security.Selector;

using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.Extensions.Options;

public class SelectorClaimsTransformation : IClaimsTransformation
{
    private IOptionsMonitor<SelectorClaimsTransformationOptions> OptionsMonitor { get; set; }
    private IServiceProvider ServiceProvider { get; set; }

    public SelectorClaimsTransformation(IServiceProvider serviceProvider, IOptionsMonitor<SelectorClaimsTransformationOptions> optionsMonitor)
    {
        OptionsMonitor = optionsMonitor;
        ServiceProvider = serviceProvider;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        SelectorClaimsTransformationOptions options = OptionsMonitor.CurrentValue;

        foreach (Func<ClaimsPrincipal, Type?> selector in options.Selectors)
        {
            Type? selectorType = selector(principal);
            if (selectorType != null)
            {
                IClaimsTransformation? transformer = ActivatorUtilities.CreateInstance(ServiceProvider, selectorType) as IClaimsTransformation;
                if (transformer == null) throw new Exception($"Unable to instantiate type \"{selectorType.FullName}\".");
                return await transformer.TransformAsync(principal).ConfigureAwait(false);
            }
        }

        return principal;
    }
}
