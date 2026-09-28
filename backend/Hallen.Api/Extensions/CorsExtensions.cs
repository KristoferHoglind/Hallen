namespace Hallen.Api.Extensions;

public static class CorsExtensions
{
    public const string AllowReactDevClientPolicy = "AllowReactDevClient";

    public static IServiceCollection AddHallenCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(AllowReactDevClientPolicy, policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:4173",
                        "http://127.0.0.1:4173"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }

    public static IApplicationBuilder UseHallenCors(this IApplicationBuilder app)
    {
        app.UseCors(AllowReactDevClientPolicy);

        return app;
    }
}