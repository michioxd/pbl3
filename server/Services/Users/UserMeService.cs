using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.Users
{
    public class UserMeService(ApplicationDbContext context) : IUserMeService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<MeResponseDto> GetMeDetailsAsync(Guid userId)
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

        public async Task<object> GetMyTicketsAsync(Guid userId)
        {
            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
            {
                throw new KeyNotFoundException("Hành khách không tồn tại.");
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

        public async Task<MyOrdersResponseDto> GetMyOrdersAsync(Guid userId)
        {
            var passengerId = await _context
                .Passengers.AsNoTracking()
                .Where(p => p.UserID == userId)
                .Select(p => p.PassengerID)
                .FirstOrDefaultAsync();

            if (passengerId == Guid.Empty)
            {
                throw new KeyNotFoundException("Hành khách không tồn tại.");
            }

            var now = DateTime.UtcNow;

            var tickets = await _context
                .Tickets.AsNoTracking()
                .Where(t => t.PassengerID == passengerId)
                .Select(t => new OrderTicketDto
                {
                    TicketID = t.TicketID,
                    TicketCode = t.TicketCode,
                    Status = t.Status.ToString(),
                    FinalPrice = t.FinalPrice,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    RouteName =
                        t.Trip != null && t.Trip.Route != null ? t.Trip.Route.RouteName : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            var response = new MyOrdersResponseDto
            {
                Booked = tickets
                    .Where(t =>
                        t.Status == nameof(TicketStatus.PendingPayment)
                        || t.Status == nameof(TicketStatus.Issued)
                    )
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Completed = tickets
                    .Where(t =>
                        t.Status == nameof(TicketStatus.CheckedIn)
                        || (t.Status == nameof(TicketStatus.Issued) && t.DepartureTime <= now)
                    )
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Cancelled = tickets
                    .Where(t => t.Status == nameof(TicketStatus.Cancelled))
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
            };

            return response;
        }
    }
}
