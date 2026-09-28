using Hallen.Database.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Hallen.Database;

public static class ApplicationBuilderExtensions
{
    public static async Task SeedDevelopmentDatabaseAsync(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        using var scope = app.Services.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<HallenDbContext>();

        await DatabaseSeeder.SeedDevelopmentDataAsync(dbContext);
    }
}