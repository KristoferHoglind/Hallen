using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Hallen.Api.Filters;

public class CsrfFilter(IAntiforgery antiforgery) : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var method = context.HttpContext.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method)) return;
        try { await antiforgery.ValidateRequestAsync(context.HttpContext); }
        catch (AntiforgeryValidationException) {
            context.HttpContext.Response.Headers["X-Hallen-CSRF-Error"] = "1";
            context.Result = new BadRequestObjectResult(new {message = "Säkerhetstoken saknas eller är ogiltig. Ladda om sidan och försök igen."});
        }
    }
}
