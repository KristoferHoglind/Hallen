using Hallen.Api.Extensions;
using Hallen.Application;
using Hallen.Database;
using Hallen.Database.Data;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

var migrateOnly = args.Contains("--migrate-only");
var builder = WebApplication.CreateBuilder(args.Where(arg => arg != "--migrate-only").ToArray());

// Render terminates TLS before forwarding requests to this container. Its opt-in
// ASPNETCORE_FORWARDEDHEADERS_ENABLED setting enables the cloud proxy middleware.
if (Environment.GetEnvironmentVariable("RENDER_EXTERNAL_HOSTNAME") is { Length: > 0 } renderHost
    && builder.Configuration["AllowedHosts"] is null or "*")
{
    builder.Configuration["AllowedHosts"] = renderHost;
}

builder.Services.AddScoped<Hallen.Api.Filters.SessionWriteFilter>();
builder.Services.AddControllers(options => options.Filters.AddService<Hallen.Api.Filters.SessionWriteFilter>());
builder.Services.AddHallenRateLimiting(builder.Configuration);
builder.Services.AddHallenApplication();
builder.Services.AddHallenDatabase(builder.Configuration);
builder.Services.AddHallenAuthentication(builder.Environment);
builder.Services.AddHallenCors(builder.Configuration, builder.Environment);

if (!builder.Environment.IsDevelopment())
{
    builder.Services.AddHttpsRedirection(options => options.HttpsPort = 443);
    builder.Services.AddDataProtection()
        .SetApplicationName("Hallen")
        .PersistKeysToDbContext<HallenDbContext>();
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (migrateOnly || builder.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<HallenDbContext>().Database.MigrateAsync();
}
if (migrateOnly) return;

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler(error => error.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { message = "Ett serverfel inträffade. Försök igen senare." });
    }));
    app.UseHsts();
}

// Render's internal health checks use HTTP and don't need a redirect or a DB query.
app.UseWhen(context => context.Request.Path != "/healthz", branch => branch.UseHttpsRedirection());

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
        context.Response.Headers.CacheControl = "no-store";
    if (context.Request.Path == "/index.html" || context.Request.Path == "/sw.js")
        context.Response.Headers.CacheControl = "no-cache";
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseDefaultFiles();
var staticFileOptions = new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.File.Name is "index.html" or "sw.js")
            context.Context.Response.Headers.CacheControl = "no-cache";
    }
};
app.UseStaticFiles(staticFileOptions);
app.UseRouting();
app.UseHallenCors();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
await app.SeedDevelopmentDatabaseAsync();

app.MapGet("/healthz", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/readyz", async (HallenDbContext db) =>
    await db.Database.CanConnectAsync() ? Results.Ok(new { status = "ready" }) : Results.StatusCode(503)).AllowAnonymous();
app.MapControllers();
// Missing API endpoints must never return the React shell.
app.Map("/api/{**path}", () => Results.NotFound());
app.MapFallbackToFile("index.html", staticFileOptions);

app.Run();
