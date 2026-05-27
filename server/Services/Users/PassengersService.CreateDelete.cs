using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.Users
{
    public partial class PassengersService
    {
        public async Task<object> CreateBusAdminUpgradeRequestAsync(CreateBusAdminUpgradeRequestDto dto, Guid userId)
        {
            var hasPendingRequest = await _context.BusAdminUpgradeRequests.AnyAsync(r =>
                r.RequesterUserID == userId && r.Status == BusAdminUpgradeRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                throw new InvalidOperationException("Bạn đã có yêu cầu nâng cấp đang chờ duyệt.");
            }

            var request = new BusAdminUpgradeRequest
            {
                RequestID = Guid.NewGuid(),
                RequesterUserID = userId,
                CompanyName = dto.CompanyName.Trim(),
                LicenseNumber = NormalizeOptional(dto.LicenseNumber),
                Hotline = NormalizeOptional(dto.Hotline),
                Reason = NormalizeOptional(dto.Reason),
                Status = BusAdminUpgradeRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            _context.BusAdminUpgradeRequests.Add(request);
            await _context.SaveChangesAsync();

            return new
            {
                message = "Gửi yêu cầu nâng cấp thành công.",
                requestId = request.RequestID,
                request.Status,
                request.RequestedAt,
            };
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
