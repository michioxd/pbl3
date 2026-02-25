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
                await _context.Database.MigrateAsync();
                _logger.LogInformation("Migrated database successfully.");

                if (!await _context.Users.AnyAsync())
                {
                    await SeedUsersAsync();
                    _logger.LogInformation("Seeded initial data successfully.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while initializing the database.");
            }
        }

        private async Task SeedUsersAsync()
        {
            var sysAdminRole = new Role { RoleID = Guid.NewGuid(), RoleName = UserRole.SysAdmin.ToString() };
            var busAdminRole = new Role { RoleID = Guid.NewGuid(), RoleName = UserRole.BusAdmin.ToString() };
            var passengerRole = new Role { RoleID = Guid.NewGuid(), RoleName = UserRole.Passenger.ToString() };

            if (!_context.Roles.Any())
            {
                _context.Roles.AddRange(sysAdminRole, busAdminRole, passengerRole);
                await _context.SaveChangesAsync();
            }
            else
            {
                sysAdminRole = await _context.Roles.FirstAsync(r => r.RoleName == UserRole.SysAdmin.ToString());
            }

            var adminUser = new User
            {
                UserID = Guid.NewGuid(),
                Username = "sysadmin",
                Email = "admin@example.com",
                PasswordHash = "abcdef", // sample, it must be hashed in prod
                PhoneNumber = "1234567890",
                RoleID = sysAdminRole.RoleID,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var phuongTrang = new BusCompany
            {
                CompanyID = Guid.NewGuid(),
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