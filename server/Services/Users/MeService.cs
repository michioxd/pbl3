using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;

namespace Pbl3.Services
{
    public interface IMeService
    {
        Task<MeResponseDto?> GetDetailsAsync(Guid userId);
        Task<object?> GetMyTicketsAsync(Guid userId);
    }

    public class MeService : IMeService
    {
        private readonly ApplicationDbContext _context;

        public MeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MeResponseDto?> GetDetailsAsync(Guid userId)
        {
            var passenger = await _context
                .Passengers.AsNoTracking()
                .Where(p => p.UserID == userId)
                .Select(p => new MePassengerDto
                {
                    PassengerID = p.PassengerID,
                    FullName = p.FullName,
                    Email = p.Email,
                    PhoneNumber = p.PhoneNumber,
                })
                .FirstOrDefaultAsync();

            if (passenger == null)
            {
                return null;
            }

            var userData = await _context
                .Users.AsNoTracking()
                .Include(u => u.Role)
                .Where(u => u.UserID == userId)
                .Select(u => new
                {
                    u.UserID,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.IsActive,
                    u.CreatedAt,
                    Role = u.Role == null ? null : new { u.Role.RoleID, u.Role.RoleName },
                })
                .FirstOrDefaultAsync();

            MeUserInfoDto? user = null;

            if (userData != null)
            {
                MeUserRoleDto? role = null;

                if (userData.Role != null)
                {
                    role = new MeUserRoleDto
                    {
                        RoleID = userData.Role.RoleID,
                        RoleName = userData.Role.RoleName,
                    };
                }

                user = new MeUserInfoDto
                {
                    UserID = userData.UserID,
                    Email = userData.Email,
                    FullName = userData.FullName,
                    PhoneNumber = userData.PhoneNumber,
                    IsActive = userData.IsActive,
                    CreatedAt = userData.CreatedAt,
                    Role = role,
                };
            }

            return new MeResponseDto { Passenger = passenger, User = user };
        }

        public async Task<object?> GetMyTicketsAsync(Guid userId)
        {
            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
            {
                return null;
            }

            var tickets = await _context
                .Tickets.Include(t => t.Trip)
                    .ThenInclude(tr => tr!.Route)
                .Include(t => t.SeatLayout)
                .Where(t => t.PassengerID == passenger.PassengerID)
                .Select(t => new
                {
                    t.TicketID,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    Price = t.FinalPrice,
                    t.Status,
                    RouteName = t.Trip != null && t.Trip.Route != null
                        ? t.Trip.Route.RouteName
                        : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            return tickets;
        }
    }
}
