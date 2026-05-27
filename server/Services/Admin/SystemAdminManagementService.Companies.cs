using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services.Admin
{
    public partial class SystemAdminManagementService
    {
        public async Task<object> BulkApproveCompaniesAsync(List<Guid> companyIds, Guid reviewerId)
        {
            if (companyIds == null || companyIds.Count == 0)
                throw new ArgumentException("Danh sách nhà xe trống.");

            var companies = await _context
                .BusCompanies.Where(c => companyIds.Contains(c.CompanyID))
                .ToListAsync();

            if (companies.Count == 0)
                throw new KeyNotFoundException("Không tìm thấy nhà xe nào.");

            if (companies.Any(c => c.Status != CompanyStatus.Pending))
                throw new ArgumentException("Chỉ có thể duyệt các nhà xe đang chờ duyệt.");

            var companyIdsToReview = companies.Select(c => c.CompanyID).ToList();
            var pendingRequests = await _context
                .CompanyProfileUpdateRequests.Where(r =>
                    companyIdsToReview.Contains(r.CompanyID)
                    && r.Status == CompanyProfileUpdateRequestStatus.Pending
                )
                .ToListAsync();

            var reviewedAt = DateTime.UtcNow;
            await using var transaction = await _context.Database.BeginTransactionAsync();

            foreach (var company in companies)
            {
                company.Status = CompanyStatus.Approved;
                company.IsApproved = true;
            }

            foreach (var request in pendingRequests)
            {
                request.Status = CompanyProfileUpdateRequestStatus.Approved;
                request.ReviewedByUserID = reviewerId;
                request.ReviewedAt = reviewedAt;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new
            {
                message = $"Đã duyệt {companies.Count} nhà xe.",
                updatedCount = companies.Count,
            };
        }

        public async Task<object> BulkSuspendCompaniesAsync(List<Guid> companyIds)
        {
            if (companyIds == null || companyIds.Count == 0)
                throw new ArgumentException("Danh sách nhà xe trống.");

            var companies = await _context
                .BusCompanies.Where(c => companyIds.Contains(c.CompanyID))
                .ToListAsync();

            if (companies.Count == 0)
                throw new KeyNotFoundException("Không tìm thấy nhà xe nào.");

            foreach (var company in companies)
            {
                company.Status = CompanyStatus.Suspended;
                company.IsApproved = false;
            }

            await _context.SaveChangesAsync();

            return new
            {
                message = $"Đã tạm ngưng {companies.Count} nhà xe.",
                updatedCount = companies.Count,
            };
        }

        public async Task<object> BulkDeleteCompaniesAsync(List<Guid> companyIds)
        {
            if (companyIds == null || companyIds.Count == 0)
                throw new ArgumentException("Danh sách nhà xe trống.");

            var companies = await _context
                .BusCompanies.Where(c => companyIds.Contains(c.CompanyID))
                .ToListAsync();

            if (companies.Count == 0)
                throw new KeyNotFoundException("Không tìm thấy nhà xe nào.");

            var companyIdsSet = companies.Select(c => c.CompanyID).ToHashSet();
            var hasRoutes = await _context.BusRoutes.AnyAsync(r =>
                companyIdsSet.Contains(r.CompanyID)
            );
            var hasBuses = await _context.Buses.AnyAsync(b => companyIdsSet.Contains(b.CompanyID));

            if (hasRoutes || hasBuses)
                throw new ArgumentException("Một số nhà xe đã có tuyến xe hoặc xe, không thể xóa.");

            // Delete related admins
            var admins = await _context
                .BusCompanyAdmins.Where(bca => companyIdsSet.Contains(bca.CompanyID))
                .ToListAsync();
            if (admins.Count > 0)
                _context.BusCompanyAdmins.RemoveRange(admins);

            _context.BusCompanies.RemoveRange(companies);
            await _context.SaveChangesAsync();

            return new
            {
                message = $"Đã xóa {companies.Count} nhà xe.",
                deletedCount = companies.Count,
            };
        }

        public async Task UpdateCompanyStatusAsync(Guid companyId, int status)
        {
            if (!Enum.IsDefined(typeof(CompanyStatus), status))
                throw new ArgumentException("Trạng thái không hợp lệ.");

            var company = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                c.CompanyID == companyId
            );
            if (company == null)
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");

            company.Status = (CompanyStatus)status;
            company.IsApproved = status == (int)CompanyStatus.Approved;

            await _context.SaveChangesAsync();
        }
    }
}
