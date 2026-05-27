using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Enums;
using Pbl3.Services;

namespace Pbl3.Services.BusAdmin
{
    public partial class BusAdminBusesService(
        ApplicationDbContext context,
        IBusAdminOwnershipService ownershipService
    ) : IBusAdminBusesService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IBusAdminOwnershipService _ownershipService = ownershipService;

        public async Task EnsureCompanyAccessAsync(Guid companyId)
        {
            var company = await _context
                .BusCompanies.AsNoTracking()
                .Where(c => c.CompanyID == companyId)
                .Select(c => new { c.IsApproved })
                .FirstOrDefaultAsync();

            if (company == null)
            {
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");
            }

            if (!company.IsApproved)
            {
                throw new InvalidOperationException("Nhà xe đang chờ duyệt. Vui lòng đợi SysAdmin xét duyệt.");
            }

            var hasPendingUpdate = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingUpdate)
            {
                throw new InvalidOperationException("Hồ sơ nhà xe đang chờ duyệt. Vui lòng đợi SysAdmin xét duyệt.");
            }
        }

        private Task<bool> IsRouteOwnedByCompanyAsync(Guid companyId, Guid routeId)
        {
            return _ownershipService.IsRouteOwnedByCompanyAsync(companyId, routeId);
        }

        private Task<bool> IsBusOwnedByCompanyAsync(Guid companyId, Guid busId)
        {
            return _ownershipService.IsBusOwnedByCompanyAsync(companyId, busId);
        }

        private Task<bool> IsTripOwnedByCompanyAsync(Guid companyId, Guid tripId)
        {
            return _ownershipService.IsTripOwnedByCompanyAsync(companyId, tripId);
        }

        private Task<bool> IsBusTypeOwnedByCompanyAsync(Guid companyId, Guid busTypeId)
        {
            return _ownershipService.IsBusTypeOwnedByCompanyAsync(companyId, busTypeId);
        }

        private Task<bool> IsBusTypeExistsAsync(Guid busTypeId)
        {
            return _ownershipService.IsBusTypeExistsAsync(busTypeId);
        }
    }
}
