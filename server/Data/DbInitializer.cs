using Microsoft.EntityFrameworkCore;

namespace Pbl3.Data
{
    public class DbInitializer
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DbInitializer> _logger;
        private readonly IServiceProvider _serviceProvider;

        public DbInitializer(
            ApplicationDbContext context,
            ILogger<DbInitializer> logger,
            IServiceProvider serviceProvider
        )
        {
            _context = context;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        public async Task RunAsync()
        {
            try
            {
                // Run migrations only
                await _context.Database.MigrateAsync();
                _logger.LogInformation("Migrated database successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while running migrations.");
            }
        }

        public async Task SeedAsync()
        {
            try
            {
                var seederLogger = _serviceProvider.GetRequiredService<ILogger<DataSeeder>>();
                var environment = _serviceProvider.GetRequiredService<IHostEnvironment>();
                var seeder = new DataSeeder(_context, seederLogger, environment);
                await seeder.SeedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}
