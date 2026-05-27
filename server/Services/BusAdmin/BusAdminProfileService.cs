using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.BusAdmin
{
    public class BusAdminProfileService(ApplicationDbContext context) : IBusAdminProfileService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<CompanyProfileUpdateRequestDto> GetCurrentRequestAsync(Guid companyId)
        {
            var request = await _context
                .CompanyProfileUpdateRequests.AsNoTracking()
                .Where(r => r.CompanyID == companyId)
                .OrderByDescending(r => r.RequestedAt)
                .Select(r => new CompanyProfileUpdateRequestDto
                {
                    RequestID = r.RequestID,
                    CompanyID = r.CompanyID,
                    Status = r.Status,
                    Name = r.Name,
                    LicenseNumber = r.LicenseNumber,
                    Hotline = r.Hotline,
                    AllowPayOnBoard = r.AllowPayOnBoard,
                    RequestedAt = r.RequestedAt,
                    ReviewedAt = r.ReviewedAt,
                    ReviewNote = r.ReviewNote,
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                throw new KeyNotFoundException("Chưa có yêu cầu cập nhật hồ sơ.");
            }

            return request;
        }

        public async Task<object> CreateRequestAsync(CreateCompanyProfileUpdateRequestDto dto, Guid companyId, Guid userId)
        {
            var hasPendingRequest = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                throw new InvalidOperationException("Bạn đã có yêu cầu cập nhật đang chờ duyệt.");
            }

            var request = new CompanyProfileUpdateRequest
            {
                RequestID = Guid.NewGuid(),
                CompanyID = companyId,
                RequesterUserID = userId,
                Name = dto.Name.Trim(),
                LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber)
                    ? null
                    : dto.LicenseNumber.Trim(),
                Hotline = string.IsNullOrWhiteSpace(dto.Hotline) ? null : dto.Hotline.Trim(),
                AllowPayOnBoard = dto.AllowPayOnBoard,
                Status = CompanyProfileUpdateRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            _context.CompanyProfileUpdateRequests.Add(request);
            await _context.SaveChangesAsync();

            return new
            {
                message = "Đã gửi yêu cầu cập nhật hồ sơ nhà xe.",
                requestId = request.RequestID,
                request.Status,
                request.RequestedAt,
            };
        }

        public async Task<object> GetCompanyProfileAsync(Guid companyId)
        {
            var company = await _context
                .BusCompanies.AsNoTracking()
                .Where(c => c.CompanyID == companyId)
                .Select(c => new
                {
                    c.CompanyID,
                    c.Name,
                    c.LicenseNumber,
                    c.Hotline,
                    c.AllowPayOnBoard,
                    c.IsApproved,
                })
                .FirstOrDefaultAsync();

            if (company == null)
            {
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");
            }

            return company;
        }

        public async Task<object> UpdateCompanyProfileRequestAsync(UpdateCompanyProfileDto dto, Guid companyId, Guid userId)
        {
            var hasPendingRequest = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                throw new InvalidOperationException("Bạn đã có yêu cầu cập nhật đang chờ duyệt.");
            }

            var request = new CompanyProfileUpdateRequest
            {
                RequestID = Guid.NewGuid(),
                CompanyID = companyId,
                RequesterUserID = userId,
                Name = dto.Name.Trim(),
                LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber)
                    ? null
                    : dto.LicenseNumber.Trim(),
                Hotline = string.IsNullOrWhiteSpace(dto.Hotline) ? null : dto.Hotline.Trim(),
                AllowPayOnBoard = dto.AllowPayOnBoard,
                Status = CompanyProfileUpdateRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            _context.CompanyProfileUpdateRequests.Add(request);
            await _context.SaveChangesAsync();

            return new { message = "Đã gửi yêu cầu cập nhật hồ sơ nhà xe." };
        }
    }
}
