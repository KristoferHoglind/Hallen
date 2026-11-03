using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hallen.Api.Controllers;

[ApiController]
public class SecurityController(IAntiforgery antiforgery) : ControllerBase
{
    [HttpGet("api/security/csrf"), AllowAnonymous]
    public IActionResult Token() {
        Response.Headers.CacheControl = "no-cache, no-store";
        Response.Headers.Pragma = "no-cache";
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new {token = tokens.RequestToken});
    }
}
