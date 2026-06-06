using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.Admin
{
    public class BusAdminUpgradeResponseService(ApplicationDbContext context) : IBusAdminUpgradeResponseService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<BusAdminUpgradeRequestListResponseDto> GetRequestsAsync(
            BusAdminUpgradeRequestStatus? status,
            int page,
            int pageSize
        )
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
                throw new ArgumentException("pageSize chỉ chấp nhận: 25, 50, 100, 200.");

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

            var totalRecords = await query.CountAsync();
            var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var requests = await query
                .OrderByDescending(r => r.RequestedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new BusAdminUpgradeRequestListItemDto
                {
                    RequestID = r.RequestID,
                    RequesterUserID = r.RequesterUserID,
                    RequesterEmail = r.RequesterUser != null ? r.RequesterUser.Email : null,
                    RequesterName = r.RequesterUser != null ? r.RequesterUser.FullName : null,
                    CompanyName = r.CompanyName,
                    LicenseNumber = r.LicenseNumber,
                    Hotline = r.Hotline,
                    Reason = r.Reason,
                    Status = r.Status,
                    RequestedAt = r.RequestedAt,
                    ReviewedAt = r.ReviewedAt,
                    ReviewNote = r.ReviewNote,
                    CompanyID = r.CompanyID,
                    BusCompany =
                        r.BusCompany == null
                            ? null
                            : new BusCompanyBasicDto
                            {
                                CompanyID = r.BusCompany.CompanyID,
                                Name = r.BusCompany.Name,
                                LicenseNumber = r.BusCompany.LicenseNumber,
                                Hotline = r.BusCompany.Hotline,
                                IsApproved = r.BusCompany.IsApproved,
                            },
                    ReviewedBy =
                        r.ReviewedByUser == null
                            ? null
                            : new UserBasicDto
                            {
                                UserID = r.ReviewedByUser.UserID,
                                Email = r.ReviewedByUser.Email,
                                FullName = r.ReviewedByUser.FullName,
                            },
                })
                .ToListAsync();

            return new BusAdminUpgradeRequestListResponseDto
            {
                Records = requests,
                Page = page,
                PageSize = pageSize,
                TotalRecords = totalRecords,
                TotalPages = totalPages,
            };
        }

        public async Task<int> GetPendingCountAsync()
        {
            return await _context.BusAdminUpgradeRequests.CountAsync(r =>
                r.Status == BusAdminUpgradeRequestStatus.Pending
            );
        }

        public async Task<object> ReviewRequestAsync(
            Guid requestId,
            ReviewBusAdminUpgradeRequestDto dto,
            Guid reviewerUserId
        )
        {
            var request = await _context.BusAdminUpgradeRequests.FirstOrDefaultAsync(r =>
                r.RequestID == requestId
            );

            if (request == null)
                throw new KeyNotFoundException("Không tìm thấy request.");

            if (request.Status != BusAdminUpgradeRequestStatus.Pending)
                throw new InvalidOperationException("Request đã được xử lý trước đó.");

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.SysAdmin.ToString()
            );
            var busAdminRole = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == UserRole.BusAdmin.ToString()
            );

            if (adminRole == null || busAdminRole == null)
                throw new InvalidOperationException("Không tìm thấy vai trò phù hợp trong hệ thống.");

            var requester = await _context.Users.FirstOrDefaultAsync(u =>
                u.UserID == request.RequesterUserID
            );
            if (requester == null)
                throw new KeyNotFoundException("Không tìm thấy tài khoản người gửi request.");

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
                        Status = CompanyStatus.Approved,
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
                    existingCompany.Status = CompanyStatus.Approved;
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

            return new
            {
                message = dto.Approve
                    ? "Đã chấp thuận yêu cầu nâng cấp."
                    : "Đã từ chối yêu cầu nâng cấp.",
                request.RequestID,
                request.Status,
            };
        }
    }
}
