using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("Admin")]
    [Authorize(Policy = "BusAdmin")]
    public partial class CreateBusAdmin : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CreateBusAdmin(ApplicationDbContext context)
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

        [HttpPost("/addBusCompany")]
        public async Task<IActionResult> AddBusCompany([FromBody] Infor_BusCompany company)
        {
            var userId = GetCurrentUserId();

            var alreadyCompanyAdmin = await _context.BusCompanyAdmins.AnyAsync(x =>
                x.UserID == userId
            );
            if (alreadyCompanyAdmin)
            {
                return Conflict(new { message = "Tài khoản đã thuộc một nhà xe." });
            }

            var normalizedLicense = string.IsNullOrWhiteSpace(company.LicenseNumber)
                ? null
                : company.LicenseNumber.Trim();

            if (normalizedLicense != null)
            {
                var duplicatedLicense = await _context.BusCompanies.AnyAsync(c =>
                    c.LicenseNumber != null
                    && c.LicenseNumber.ToLower() == normalizedLicense.ToLower()
                );

                if (duplicatedLicense)
                {
                    return Conflict(new { message = "LicenseNumber đã tồn tại." });
                }
            }

            var busCompany = new BusCompany
            {
                CompanyID = Guid.NewGuid(),
                Name = company.Name.Trim(),
                LicenseNumber = normalizedLicense,
                Hotline = string.IsNullOrWhiteSpace(company.Hotline)
                    ? null
                    : company.Hotline.Trim(),
                IsApproved = true,
            };

            var busCompanyAdmin = new BusCompanyAdmin
            {
                UserID = userId,
                CompanyID = busCompany.CompanyID,
                Roles = "O",
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            _context.BusCompanies.Add(busCompany);
            _context.BusCompanyAdmins.Add(busCompanyAdmin);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return StatusCode(
                StatusCodes.Status201Created,
                new
                {
                    message = "Đăng ký nhà xe thành công.",
                    busCompany.CompanyID,
                    busCompany.Name,
                    busCompany.LicenseNumber,
                    busCompany.Hotline,
                    busCompany.IsApproved,
                }
            );
        }
    }
}
