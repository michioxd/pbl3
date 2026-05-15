using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services
{
    public interface IPassengerService
    {
        Task<(int StatusCode, string? ErrorMessage, object? Data)> GetProfileAsync(Guid userId);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> GetMyTicketsAsync(Guid userId);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateProfileAsync(Guid userId, UpdatePassengerDto dto);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateBusAdminUpgradeRequestAsync(Guid userId, CreateBusAdminUpgradeRequestDto dto);
    }

    public class PassengerService : IPassengerService
    {
        private readonly ApplicationDbContext _context;

        public PassengerService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> GetProfileAsync(Guid userId)
        {
            var passenger = await _context
                .Passengers.Include(p => p.User)
                .Where(p => p.UserID == userId)
                .Select(p => new
                {
                    p.PassengerID,
                    p.FullName,
                    p.Email,
                    p.PhoneNumber,
                    p.IdentityCard,
                })
                .FirstOrDefaultAsync();

            if (passenger == null)
                return (404, "Không tìm thấy hồ sơ hành khách.", null);

            return (200, null, passenger);
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> GetMyTicketsAsync(Guid userId)
        {
            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null)
                return (404, "Hành khách không tồn tại.", null);

            var tickets = await _context
                .Tickets.Include(t => t.Trip)
                    .ThenInclude(tr => tr!.Route)
                .Include(t => t.SeatLayout)
                .Where(t => t.PassengerID == passenger.PassengerID)
                .Select(t => new
                {
                    t.TicketID,
                    t.TicketCode,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    Price = t.FinalPrice,
                    t.Status,
                    RouteName = t.Trip != null && t.Trip.Route != null
                        ? t.Trip.Route.RouteName
                        : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            return (200, null, tickets);
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> UpdateProfileAsync(Guid userId, UpdatePassengerDto dto)
        {
            var passenger = await _context
                .Passengers.Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null)
                return (404, "Không tìm thấy hành khách.", null);

            passenger.FullName = dto.FullName;
            passenger.PhoneNumber = dto.PhoneNumber;
            passenger.IdentityCard = dto.IdentityCard;

            await _context.SaveChangesAsync();
            return (200, null, new { message = "Cập nhật thành công." });
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateBusAdminUpgradeRequestAsync(Guid userId, CreateBusAdminUpgradeRequestDto dto)
        {
            var hasPendingRequest = await _context.BusAdminUpgradeRequests.AnyAsync(r =>
                r.RequesterUserID == userId && r.Status == BusAdminUpgradeRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                return (409, "Bạn đã có yêu cầu nâng cấp đang chờ duyệt.", null);
            }

            var request = new BusAdminUpgradeRequest
            {
                RequestID = Guid.NewGuid(),
                RequesterUserID = userId,
                CompanyName = dto.CompanyName.Trim(),
                LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? null : dto.LicenseNumber.Trim(),
                Hotline = string.IsNullOrWhiteSpace(dto.Hotline) ? null : dto.Hotline.Trim(),
                Reason = string.IsNullOrWhiteSpace(dto.Reason) ? null : dto.Reason.Trim(),
                Status = BusAdminUpgradeRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            _context.BusAdminUpgradeRequests.Add(request);
            await _context.SaveChangesAsync();

            return (201, null, new
            {
                message = "Gửi yêu cầu nâng cấp thành công.",
                requestId = request.RequestID,
                request.Status,
                request.RequestedAt,
            });
        }
    }
}
