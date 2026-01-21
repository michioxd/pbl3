using Pbl3.Data;

namespace Pbl3.Extensions
{
    public static class HostExtensions
    {
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
                    logger.LogInformation("DB OK");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred during database initialization.");
                }
            }
        }
    }
}