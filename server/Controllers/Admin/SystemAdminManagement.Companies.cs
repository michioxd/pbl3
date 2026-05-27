using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpPatch("companies/bulk/approve")]
        public async Task<IActionResult> BulkApproveCompanies([FromBody] BulkCompanyActionDto dto)
        {
            var reviewerId = GetCurrentUserId();
            var result = await _service.BulkApproveCompaniesAsync(dto.CompanyIds, reviewerId);
            return Ok(result);
        }

        [HttpPatch("companies/bulk/suspend")]
        public async Task<IActionResult> BulkSuspendCompanies([FromBody] BulkCompanyActionDto dto)
        {
            var result = await _service.BulkSuspendCompaniesAsync(dto.CompanyIds);
            return Ok(result);
        }

        [HttpDelete("companies/bulk")]
        public async Task<IActionResult> BulkDeleteCompanies([FromBody] BulkCompanyActionDto dto)
        {
            var result = await _service.BulkDeleteCompaniesAsync(dto.CompanyIds);
            return Ok(result);
        }

        [HttpPatch("companies/{companyId:guid}/status")]
        public async Task<IActionResult> UpdateCompanyStatus(
            Guid companyId,
            [FromBody] UpdateCompanyStatusDto dto
        )
        {
            await _service.UpdateCompanyStatusAsync(companyId, dto.Status);
            return Ok(new { message = "Cập nhật trạng thái thành công.", status = dto.Status });
        }
    }
}
