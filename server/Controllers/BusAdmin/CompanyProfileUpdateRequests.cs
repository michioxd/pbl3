using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Services;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/company-update-requests")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public class CompanyProfileUpdateRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly IBusAdminOwnershipService _ownershipService;

        public CompanyProfileUpdateRequestsController(
            ApplicationDbContext context,
            ICurrentUserContext currentUserContext,
            IBusAdminOwnershipService ownershipService
        )
        {
            _context = context;
            _currentUserContext = currentUserContext;
            _ownershipService = ownershipService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentRequest()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var companyId = await _ownershipService.GetCurrentCompanyIdAsync(userId);
            if (companyId == null)
                return Forbid();

            var request = await _context
                .CompanyProfileUpdateRequests.AsNoTracking()
                .Where(r => r.CompanyID == companyId.Value)
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
                return NotFound(new { message = "Chưa có yêu cầu cập nhật hồ sơ." });
            }

            return Ok(request);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest(
            [FromBody] CreateCompanyProfileUpdateRequestDto dto
        )
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var companyId = await _ownershipService.GetCurrentCompanyIdAsync(userId);
            if (companyId == null)
                return Forbid();

            var hasPendingRequest = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId.Value
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingRequest)
            {
                return Conflict(new { message = "Bạn đã có yêu cầu cập nhật đang chờ duyệt." });
            }

            var request = new Models.CompanyProfileUpdateRequest
            {
                RequestID = Guid.NewGuid(),
                CompanyID = companyId.Value,
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

            return StatusCode(
                StatusCodes.Status201Created,
                new
                {
                    message = "Đã gửi yêu cầu cập nhật hồ sơ nhà xe.",
                    requestId = request.RequestID,
                    request.Status,
                    request.RequestedAt,
                }
            );
        }
    }
}
