using Microsoft.EntityFrameworkCore;
using Pbl3.Data;

namespace Pbl3.Extensions
{
    public static class HostExtensions
    {
        public static async Task MigrateDatabaseAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<Program>>();

            try
            {
                var context = services.GetRequiredService<ApplicationDbContext>();
                var pendingMigrations = (
                    await context.Database.GetPendingMigrationsAsync()
                ).ToList();

                if (pendingMigrations.Count == 0)
                {
                    logger.LogInformation("Database is already up to date.");
                    return;
                }

                logger.LogInformation(
                    "Applying {Count} pending migration(s): {Migrations}",
                    pendingMigrations.Count,
                    string.Join(", ", pendingMigrations)
                );

                await context.Database.MigrateAsync();

                logger.LogInformation("Database migration completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while applying database migrations.");
                throw;
            }
        }

        public static async Task InitializeDatabaseAsync(this WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();
                try
                {
                    var initializer = services.GetRequiredService<DbInitializer>();
                    await initializer.RunAsync();
                    logger.LogInformation("Database migration completed successfully.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred during database initialization.");
                }
            }
        }

        public static async Task SeedDatabaseAsync(this WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();
                try
                {
                    logger.LogInformation("Starting database seeding...");
                    var initializer = services.GetRequiredService<DbInitializer>();
                    await initializer.SeedAsync();
                    logger.LogInformation("Database seeding completed successfully.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred during database seeding.");
                }
            }
        }
    }
}
