using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers.Admin
{
    public partial class BusAdminUpgradeResponse
    {
        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] BusAdminUpgradeRequestStatus? status
        )
        {
            var query = _context
                .BusAdminUpgradeRequests.AsNoTracking()
                .Include(r => r.RequesterUser)
                .Include(r => r.ReviewedByUser)
                .Include(r => r.BusCompany)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            var requests = await query
                .OrderByDescending(r => r.RequestedAt)
                .Select(r => new
                {
                    r.RequestID,
                    r.RequesterUserID,
                    RequesterEmail = r.RequesterUser != null ? r.RequesterUser.Email : null,
                    RequesterName = r.RequesterUser != null ? r.RequesterUser.FullName : null,
                    r.CompanyName,
                    r.LicenseNumber,
                    r.Hotline,
                    r.Reason,
                    r.Status,
                    r.RequestedAt,
                    r.ReviewedAt,
                    r.ReviewNote,
                    r.CompanyID,
                    BusCompany = r.BusCompany == null
                        ? null
                        : new
                        {
                            r.BusCompany.CompanyID,
                            r.BusCompany.Name,
                            r.BusCompany.LicenseNumber,
                            r.BusCompany.Hotline,
                            r.BusCompany.IsApproved,
                        },
                    ReviewedBy = r.ReviewedByUser == null
                        ? null
                        : new
                        {
                            r.ReviewedByUser.UserID,
                            r.ReviewedByUser.Email,
                            r.ReviewedByUser.FullName,
                        },
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPatch("{requestId:guid}/review")]
        public async Task<IActionResult> ReviewRequest(
            Guid requestId,
            [FromBody] ReviewBusAdminUpgradeRequestDto dto
        )
        {
            var reviewerUserId = GetCurrentUserId();

            var request = await _context.BusAdminUpgradeRequests.FirstOrDefaultAsync(r =>
                r.RequestID == requestId
            );

            if (request == null)
                return NotFound(new { message = "Không tìm thấy request." });

            if (request.Status != BusAdminUpgradeRequestStatus.Pending)
            {
                return BadRequest(new { message = "Request đã được xử lý trước đó." });
            }

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.SysAdmin.ToString()
            );
            var busAdminRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.BusAdmin.ToString()
            );

            if (adminRole == null || busAdminRole == null)
                return Problem("common:internal_server_error");

            var requester = await _context.Users.FirstOrDefaultAsync(u =>
                u.UserID == request.RequesterUserID
            );
            if (requester == null)
                return NotFound(new { message = "Không tìm thấy tài khoản người gửi request." });

            await using var transaction = await _context.Database.BeginTransactionAsync();

            request.ReviewedByUserID = reviewerUserId;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewNote = dto.ReviewNote?.Trim();

            if (dto.Approve)
            {
                var existingCompany = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                    c.CompanyID == request.CompanyID
                );

                if (existingCompany == null)
                {
                    existingCompany = new BusCompany
                    {
                        CompanyID = Guid.NewGuid(),
                        Name = request.CompanyName.Trim(),
                        LicenseNumber = string.IsNullOrWhiteSpace(request.LicenseNumber)
                            ? null
                            : request.LicenseNumber.Trim(),
                        Hotline = string.IsNullOrWhiteSpace(request.Hotline)
                            ? null
                            : request.Hotline.Trim(),
                        IsApproved = true,
                    };

                    _context.BusCompanies.Add(existingCompany);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    existingCompany.Name = request.CompanyName.Trim();
                    existingCompany.LicenseNumber = string.IsNullOrWhiteSpace(request.LicenseNumber)
                        ? null
                        : request.LicenseNumber.Trim();
                    existingCompany.Hotline = string.IsNullOrWhiteSpace(request.Hotline)
                        ? null
                        : request.Hotline.Trim();
                    existingCompany.IsApproved = true;
                }

                request.CompanyID = existingCompany.CompanyID;
                request.Status = BusAdminUpgradeRequestStatus.Approved;

                requester.RoleID = busAdminRole.RoleID;

                var busCompanyAdminExists = await _context.BusCompanyAdmins.AnyAsync(x =>
                    x.UserID == requester.UserID
                );

                if (!busCompanyAdminExists)
                {
                    _context.BusCompanyAdmins.Add(
                        new BusCompanyAdmin
                        {
                            UserID = requester.UserID,
                            CompanyID = existingCompany.CompanyID,
                            Roles = "O",
                        }
                    );
                }

                _context.Notifications.Add(
                    new Notification
                    {
                        NotifID = Guid.NewGuid(),
                        UserID = requester.UserID,
                        RequestID = request.RequestID,
                        Type = NotificationType.Email,
                        Content = "Yêu cầu nâng cấp tài khoản lên BusAdmin đã được chấp thuận.",
                        Status = NotificationStatus.Sent,
                    }
                );
            }
            else
            {
                request.Status = BusAdminUpgradeRequestStatus.Rejected;

                _context.Notifications.Add(
                    new Notification
                    {
                        NotifID = Guid.NewGuid(),
                        UserID = requester.UserID,
                        RequestID = request.RequestID,
                        Type = NotificationType.Email,
                        Content = "Yêu cầu nâng cấp tài khoản lên BusAdmin đã bị từ chối.",
                        Status = NotificationStatus.Sent,
                    }
                );
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(
                new
                {
                    message = dto.Approve
                        ? "Đã chấp thuận yêu cầu nâng cấp."
                        : "Đã từ chối yêu cầu nâng cấp.",
                    request.RequestID,
                    request.Status,
                }
            );
        }
    }
}
