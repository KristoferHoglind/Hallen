using System.Security.Claims;
using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Hallen.Api.Extensions;

public static class RateLimitingExtensions
{
    public static IServiceCollection AddHallenRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.Headers.RetryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                    ? Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture) : "60";
                await context.HttpContext.Response.WriteAsJsonAsync("För många försök. Vänta en stund och försök igen.", cancellationToken);
            };
            options.AddPolicy("auth", context => RateLimitPartition.GetSlidingWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = configuration.GetValue("RateLimiting:AuthPermitLimit", 60),
                    Window = TimeSpan.FromMinutes(1), SegmentsPerWindow = 6, QueueLimit = 0,
                }));
            options.AddPolicy("invitations", context => RateLimitPartition.GetFixedWindowLimiter(
                context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = configuration.GetValue("RateLimiting:InvitationPermitLimit", 20),
                    Window = TimeSpan.FromHours(1), QueueLimit = 0,
                }));
        });
        return services;
    }
}
