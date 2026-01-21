using Microsoft.EntityFrameworkCore;
using Pbl3.Models;
using Pbl3.Enums;

namespace Pbl3.Data
{
    public class DbInitializer
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DbInitializer> _logger;

        public DbInitializer(ApplicationDbContext context, ILogger<DbInitializer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task RunAsync()
        {
            try
            {
                if (_context.Database.GetPendingMigrations().Any())
                {
                    await _context.Database.MigrateAsync();
                    _logger.LogInformation("Migrated database successfully.");
                }

                if (!await _context.Users.AnyAsync())
                {
                    await SeedUsersAsync();
                    _logger.LogInformation("Seeded initial data successfully.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while initializing the database.");
                throw;
            }
        }

        private async Task SeedUsersAsync()
        {
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Username = "sysadmin",
                Email = "admin@example.com",
                PasswordHash = "abcdef",
                PhoneNumber = "1234567890",
                Role = UserRole.SysAdmin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var phuongTrang = new BusCompany
            {
                Id = Guid.NewGuid(),
                Name = "Phuong Trang Lines",
                LicenseNumber = "VN-PT-001",
                Hotline = "19006067",
                IsApproved = true
            };

            _context.Users.Add(adminUser);
            _context.BusCompanies.Add(phuongTrang);

            await _context.SaveChangesAsync();
        }
    }
}