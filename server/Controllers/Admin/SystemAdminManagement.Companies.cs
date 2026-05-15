using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpPatch("companies/bulk/approve")]
        public async Task<IActionResult> BulkApproveCompanies([FromBody] BulkCompanyActionDto dto)
        {
            if (dto.CompanyIds.Count == 0)
                return BadRequest(new { message = "Danh sách nhà xe trống." });

            var companies = await _context
                .BusCompanies.Where(c => dto.CompanyIds.Contains(c.CompanyID))
                .ToListAsync();

            if (companies.Count == 0)
                return NotFound(new { message = "Không tìm thấy nhà xe nào." });

            foreach (var company in companies)
            {
                company.Status = CompanyStatus.Approved;
                company.IsApproved = true;
            }

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message = $"Đã duyệt {companies.Count} nhà xe.",
                    updatedCount = companies.Count,
                }
            );
        }

        [HttpPatch("companies/bulk/suspend")]
        public async Task<IActionResult> BulkSuspendCompanies([FromBody] BulkCompanyActionDto dto)
        {
            if (dto.CompanyIds.Count == 0)
                return BadRequest(new { message = "Danh sách nhà xe trống." });

            var companies = await _context
                .BusCompanies.Where(c => dto.CompanyIds.Contains(c.CompanyID))
                .ToListAsync();

            if (companies.Count == 0)
                return NotFound(new { message = "Không tìm thấy nhà xe nào." });

            foreach (var company in companies)
            {
                company.Status = CompanyStatus.Suspended;
                company.IsApproved = false;
            }

            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message = $"Đã tạm ngưng {companies.Count} nhà xe.",
                    updatedCount = companies.Count,
                }
            );
        }

        [HttpDelete("companies/bulk")]
        public async Task<IActionResult> BulkDeleteCompanies([FromBody] BulkCompanyActionDto dto)
        {
            if (dto.CompanyIds.Count == 0)
                return BadRequest(new { message = "Danh sách nhà xe trống." });

            var companies = await _context
                .BusCompanies.Where(c => dto.CompanyIds.Contains(c.CompanyID))
                .ToListAsync();

            if (companies.Count == 0)
                return NotFound(new { message = "Không tìm thấy nhà xe nào." });

            var companyIdsSet = companies.Select(c => c.CompanyID).ToHashSet();
            var hasRoutes = await _context.BusRoutes.AnyAsync(r =>
                companyIdsSet.Contains(r.CompanyID)
            );
            var hasBuses = await _context.Buses.AnyAsync(b => companyIdsSet.Contains(b.CompanyID));

            if (hasRoutes || hasBuses)
            {
                return BadRequest(
                    new { message = "Một số nhà xe đã có tuyến xe hoặc xe, không thể xóa." }
                );
            }

            // Delete related admins
            var admins = await _context
                .BusCompanyAdmins.Where(bca => companyIdsSet.Contains(bca.CompanyID))
                .ToListAsync();
            if (admins.Count > 0)
                _context.BusCompanyAdmins.RemoveRange(admins);

            _context.BusCompanies.RemoveRange(companies);
            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    message = $"Đã xóa {companies.Count} nhà xe.",
                    deletedCount = companies.Count,
                }
            );
        }

        [HttpPatch("companies/{companyId:guid}/status")]
        public async Task<IActionResult> UpdateCompanyStatus(
            Guid companyId,
            [FromBody] UpdateCompanyStatusDto dto
        )
        {
            if (!Enum.IsDefined(typeof(CompanyStatus), dto.Status))
                return BadRequest(new { message = "Trạng thái không hợp lệ." });

            var company = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                c.CompanyID == companyId
            );
            if (company == null)
                return NotFound(new { message = "Không tìm thấy nhà xe." });

            company.Status = (CompanyStatus)dto.Status;
            company.IsApproved = dto.Status == (int)CompanyStatus.Approved;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái thành công.", status = dto.Status });
        }
    }
}
