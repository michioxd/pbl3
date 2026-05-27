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
    public class CompanyProfileUpdateRequestService(ApplicationDbContext context) : ICompanyProfileUpdateRequestService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<object> GetRequestsAsync(
            CompanyProfileUpdateRequestStatus? status,
            int page,
            int pageSize
        )
        {
            if (page < 1)
                throw new ArgumentException("page phải lớn hơn hoặc bằng 1.");

            var query = _context.CompanyProfileUpdateRequests.AsNoTracking();

            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            var totalRecords = await query.CountAsync();
            var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

            var records = await query
                .OrderByDescending(r => r.RequestedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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
                .ToListAsync();

            return new
            {
                page,
                pageSize,
                totalRecords,
                totalPages,
                records,
            };
        }

        public async Task ReviewRequestAsync(
            Guid requestId,
            ReviewCompanyProfileUpdateRequestDto dto,
            Guid reviewerUserId
        )
        {
            if (dto.Status == CompanyProfileUpdateRequestStatus.Pending)
            {
                throw new ArgumentException("Trạng thái không hợp lệ.");
            }

            var request = await _context.CompanyProfileUpdateRequests.FirstOrDefaultAsync(r =>
                r.RequestID == requestId
            );

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy yêu cầu cập nhật.");
            }

            if (request.Status != CompanyProfileUpdateRequestStatus.Pending)
            {
                throw new InvalidOperationException("Yêu cầu đã được xử lý.");
            }

            var company = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                c.CompanyID == request.CompanyID
            );

            if (company == null)
            {
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");
            }

            if (dto.Status == CompanyProfileUpdateRequestStatus.Approved)
            {
                company.Name = request.Name;
                company.LicenseNumber = request.LicenseNumber;
                company.Hotline = request.Hotline;
                company.AllowPayOnBoard = request.AllowPayOnBoard;
                company.IsApproved = true;
            }

            request.Status = dto.Status;
            request.ReviewNote = string.IsNullOrWhiteSpace(dto.ReviewNote)
                ? null
                : dto.ReviewNote.Trim();
            request.ReviewedByUserID = reviewerUserId;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }
}
