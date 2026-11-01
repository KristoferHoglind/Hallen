using Hallen.Database.Data;
using Hallen.Database.Entities;
using Microsoft.AspNetCore.Identity;

namespace Hallen.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddHallenAuthentication(
        this IServiceCollection services,
        IWebHostEnvironment environment)
    {
        services
            .AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);

                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<HallenDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services.Configure<DataProtectionTokenProviderOptions>(options => options.TokenLifespan = TimeSpan.FromHours(1));
        services.Configure<SecurityStampValidatorOptions>(options => options.ValidationInterval = TimeSpan.Zero);

        services
            .AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddIdentityCookies();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = environment.IsDevelopment() ? "Hallen.Dev.Auth" : "Hallen.Auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            // Vite proxies local /api requests from the HTTP development origin.
            options.Cookie.SecurePolicy = environment.IsDevelopment() ? CookieSecurePolicy.None : CookieSecurePolicy.Always;

            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            };

            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };
        });

        services.AddAuthorization();

        return services;
    }
}