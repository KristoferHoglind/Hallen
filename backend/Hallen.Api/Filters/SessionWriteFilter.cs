using Hallen.Api.Extensions;
using Hallen.Application.SportsGroups;
using Hallen.Database.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace Hallen.Api.Filters;

// Serialize session mutations, including closing/reopening, before an action writes.
public class SessionWriteFilter(HallenDbContext db, ISportsGroupAuthorizationService authorization) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        if (HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method) || context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            await next(); return;
        }
        var controller = context.RouteData.Values["controller"]?.ToString();
        Guid? sessionId = null;
        if (controller is "GameSessions" or "GameSessionSetup" || context.RouteData.Values.ContainsKey("gameSessionId"))
        {
            var value = context.RouteData.Values["gameSessionId"] ?? context.RouteData.Values["id"];
            if (Guid.TryParse(value?.ToString(), out var parsed)) sessionId = parsed;
        }
        else if (Guid.TryParse(context.RouteData.Values["id"]?.ToString(), out var id))
        {
            if (controller == "GameTeams") sessionId = await db.GameTeams.Where(x => x.Id == id).Select(x => (Guid?)x.GameSessionId).FirstOrDefaultAsync();
            if (controller == "GameMatches") sessionId = await db.GameMatches.Where(x => x.Id == id).Select(x => (Guid?)x.GameSessionId).FirstOrDefaultAsync();
        }
        if (sessionId is not Guid session || !await authorization.CanManageGameSessionAsync(session, context.HttpContext.User.GetUserId()))
        {
            await next(); return;
        }
        await using var transaction = await db.Database.BeginTransactionAsync();
        var record = await db.GameSessions.FromSqlInterpolated($"SELECT * FROM game_sessions WHERE id = {session} FOR UPDATE").AsNoTracking().SingleOrDefaultAsync();
        if (record?.IsClosed == true && context.RouteData.Values["action"]?.ToString() != "SetStatus")
        {
            context.Result = new ConflictObjectResult(new { message = "Sessionen är avslutad. Öppna den för redigering först." });
            return;
        }
        var result = await next();
        if (result.Exception is null && result.Result is not ObjectResult { StatusCode: >= 400 } && result.Result is not StatusCodeResult { StatusCode: >= 400 })
            await transaction.CommitAsync();
    }
}
