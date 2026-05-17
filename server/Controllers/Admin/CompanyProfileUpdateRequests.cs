using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/company-update-requests")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public class CompanyProfileUpdateRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompanyProfileUpdateRequestsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            var userIdString =
                User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdString, out Guid userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Không tìm thấy UserID trong token.");
        }

        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] CompanyProfileUpdateRequestStatus? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            var query = _context.CompanyProfileUpdateRequests.AsNoTracking();

            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            var totalRecords = await query.CountAsync();
            var totalPages =
                totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);

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

            return Ok(
                new
                {
                    page,
                    pageSize,
                    totalRecords,
                    totalPages,
                    records,
                }
            );
        }

        [HttpPatch("{requestId:guid}/review")]
        public async Task<IActionResult> ReviewRequest(
            Guid requestId,
            [FromBody] ReviewCompanyProfileUpdateRequestDto dto
        )
        {
            if (dto.Status == CompanyProfileUpdateRequestStatus.Pending)
            {
                return BadRequest(new { message = "Trạng thái không hợp lệ." });
            }

            var request = await _context.CompanyProfileUpdateRequests.FirstOrDefaultAsync(r =>
                r.RequestID == requestId
            );

            if (request == null)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu cập nhật." });
            }

            if (request.Status != CompanyProfileUpdateRequestStatus.Pending)
            {
                return Conflict(new { message = "Yêu cầu đã được xử lý." });
            }

            var company = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                c.CompanyID == request.CompanyID
            );

            if (company == null)
            {
                return NotFound(new { message = "Không tìm thấy nhà xe." });
            }

            var reviewerId = GetCurrentUserId();

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
            request.ReviewedByUserID = reviewerId;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã cập nhật trạng thái yêu cầu." });
        }
    }
}
