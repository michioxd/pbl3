using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpPost("upgrade-requests/busadmin")]
        public async Task<IActionResult> CreateBusAdminUpgradeRequest(
            [FromBody] CreateBusAdminUpgradeRequestDto dto
        )
        {
            var userId = GetCurrentUserId();

            var hasPendingRequest = await _context.BusAdminUpgradeRequests.AnyAsync(r =>
                r.RequesterUserID == userId && r.Status == BusAdminUpgradeRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                return Conflict(new { message = "Bạn đã có yêu cầu nâng cấp đang chờ duyệt." });
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

            return StatusCode(
                StatusCodes.Status201Created,
                new
                {
                    message = "Gửi yêu cầu nâng cấp thành công.",
                    requestId = request.RequestID,
                    request.Status,
                    request.RequestedAt,
                }
            );
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
