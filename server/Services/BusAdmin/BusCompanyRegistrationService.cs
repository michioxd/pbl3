using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Services
{
    public interface IBusCompanyRegistrationService
    {
        Task<(int StatusCode, string? ErrorMessage, object? Data)> RegisterCompanyAsync(Guid userId, Infor_BusCompany company);
    }

    public class BusCompanyRegistrationService : IBusCompanyRegistrationService
    {
        private readonly ApplicationDbContext _context;

        public BusCompanyRegistrationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(int StatusCode, string? ErrorMessage, object? Data)> RegisterCompanyAsync(Guid userId, Infor_BusCompany company)
        {
            var alreadyCompanyAdmin = await _context.BusCompanyAdmins.AnyAsync(x =>
                x.UserID == userId
            );
            if (alreadyCompanyAdmin)
            {
                return (409, "Tài khoản đã thuộc một nhà xe.", null);
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
                    return (409, "LicenseNumber đã tồn tại.", null);
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
                IsApproved = false,
            };

            var busCompanyAdmin = new BusCompanyAdmin
            {
                UserID = userId,
                CompanyID = busCompany.CompanyID,
                Roles = "O",
            };

            var updateRequest = new CompanyProfileUpdateRequest
            {
                RequestID = Guid.NewGuid(),
                CompanyID = busCompany.CompanyID,
                RequesterUserID = userId,
                Name = busCompany.Name,
                LicenseNumber = busCompany.LicenseNumber,
                Hotline = busCompany.Hotline,
                Status = CompanyProfileUpdateRequestStatus.Pending,
                RequestedAt = DateTime.UtcNow,
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            _context.BusCompanies.Add(busCompany);
            _context.BusCompanyAdmins.Add(busCompanyAdmin);
            _context.CompanyProfileUpdateRequests.Add(updateRequest);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return (201, null, new
            {
                message = "Đăng ký nhà xe thành công.",
                busCompany.CompanyID,
                busCompany.Name,
                busCompany.LicenseNumber,
                busCompany.Hotline,
                busCompany.IsApproved,
            });
        }
    }
}
