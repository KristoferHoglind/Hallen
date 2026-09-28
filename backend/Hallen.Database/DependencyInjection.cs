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
        services.AddDbContext<HallenDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }
}