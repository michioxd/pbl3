using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services
{
    public interface ICompanyProfileUpdateRequestsService
    {
        Task<(int StatusCode, string? ErrorMessage, object? Data)> GetCurrentRequestAsync(Guid companyId);
        Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateRequestAsync(Guid companyId, Guid userId, CreateCompanyProfileUpdateRequestDto dto);
    }

    public class CompanyProfileUpdateRequestsService : ICompanyProfileUpdateRequestsService
    {
        private readonly ApplicationDbContext _context;

        public CompanyProfileUpdateRequestsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> GetCurrentRequestAsync(Guid companyId)
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
                    RequestedAt = r.RequestedAt,
                    ReviewedAt = r.ReviewedAt,
                    ReviewNote = r.ReviewNote,
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return (404, "Chưa có yêu cầu cập nhật hồ sơ.", null);
            }

            return (200, null, request);
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> CreateRequestAsync(Guid companyId, Guid userId, CreateCompanyProfileUpdateRequestDto dto)
        {
            var hasPendingRequest = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                return (409, "Bạn đã có yêu cầu cập nhật đang chờ duyệt.", null);
            }

            var request = new Models.CompanyProfileUpdateRequest
            {
                RequestID = Guid.NewGuid(),
                CompanyID = companyId,
                RequesterUserID = userId,
                Name = dto.Name.Trim(),
                LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber)
                    ? null
                    : dto.LicenseNumber.Trim(),
                Hotline = string.IsNullOrWhiteSpace(dto.Hotline) ? null : dto.Hotline.Trim(),
                Status = CompanyProfileUpdateRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            _context.CompanyProfileUpdateRequests.Add(request);
            await _context.SaveChangesAsync();

            return (201, null, new
            {
                message = "Đã gửi yêu cầu cập nhật hồ sơ nhà xe.",
                requestId = request.RequestID,
                request.Status,
                request.RequestedAt,
            });
        }
    }
}
