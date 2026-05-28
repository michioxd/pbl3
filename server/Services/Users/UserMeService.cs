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
            var data = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserID == userId)
                .Select(u => new MeResponseDto
                {
                    User = new MeUserInfoDto
                    {
                        UserID = u.UserID,
                        Email = u.Email,
                        FullName = u.FullName,
                        PhoneNumber = u.PhoneNumber,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt,
                        Role = u.Role == null ? null : new MeUserRoleDto
                        {
                            RoleID = u.Role.RoleID,
                            RoleName = u.Role.RoleName,
                        }
                    },
                    Passenger = _context.Passengers
                        .Where(p => p.UserID == u.UserID)
                        .Select(p => new MePassengerDto
                        {
                            PassengerID = p.PassengerID,
                            FullName = p.FullName,
                            Email = p.Email,
                            PhoneNumber = p.PhoneNumber,
                        })
                        .FirstOrDefault()
                })
                .FirstOrDefaultAsync();

            return data ?? new MeResponseDto();
        }

        public async Task<MyOrdersResponseDto> GetMyOrdersAsync(Guid userId)
        {
            var passengerExists = await _context.Passengers.AsNoTracking().AnyAsync(p => p.UserID == userId);
            if (!passengerExists)
            {
                throw new KeyNotFoundException("Hành khách không tồn tại.");
            }

            var now = DateTime.UtcNow;

            var tickets = await _context
                .Tickets.AsNoTracking()
                .Where(t => t.Passenger != null && t.Passenger.UserID == userId)
                .Select(t => new OrderTicketDto
                {
                    TicketID = t.TicketID,
                    TicketCode = t.TicketCode,
                    Status = t.Status.ToString(),
                    FinalPrice = t.FinalPrice,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    RouteName = t.Trip != null && t.Trip.Route != null ? t.Trip.Route.RouteName : null,
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
