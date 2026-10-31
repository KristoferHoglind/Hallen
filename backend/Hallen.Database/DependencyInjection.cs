using Hallen.Database.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hallen.Database;

public static class DependencyInjection
{
    public static IServiceCollection AddHallenDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Configure ConnectionStrings__DefaultConnection before starting Hallen.");

        services.AddDbContext<HallenDbContext>(options => options.UseNpgsql(connectionString));

        return services;
    }
}