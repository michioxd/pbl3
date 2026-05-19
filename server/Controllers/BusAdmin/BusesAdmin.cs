using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Enums;
using Pbl3.Services;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/buses")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public partial class BusesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly IBusAdminOwnershipService _ownershipService;
        private readonly IBusesAdminService _busesAdminService;
        private readonly IBusesAdminCommandService _commandService;

        public BusesController(
            ApplicationDbContext context,
            ICurrentUserContext currentUserContext,
            IBusAdminOwnershipService ownershipService,
            IBusesAdminService busesAdminService,
            IBusesAdminCommandService commandService
        )
        {
            _context = context;
            _currentUserContext = currentUserContext;
            _ownershipService = ownershipService;
            _busesAdminService = busesAdminService;
            _commandService = commandService;
        }

        private async Task<Guid?> GetCurrentCompanyIdAsync()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            return await _ownershipService.GetCurrentCompanyIdAsync(userId);
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

        private async Task<IActionResult?> EnsureCompanyAccessAsync(Guid companyId)
        {
            var company = await _context
                .BusCompanies.AsNoTracking()
                .Where(c => c.CompanyID == companyId)
                .Select(c => new { c.IsApproved })
                .FirstOrDefaultAsync();

            if (company == null)
            {
                return NotFound(new { message = "Không tìm thấy nhà xe." });
            }

            if (!company.IsApproved)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    new { message = "Nhà xe đang chờ duyệt. Vui lòng đợi SysAdmin xét duyệt." }
                );
            }

            var hasPendingUpdate = await _context.CompanyProfileUpdateRequests.AnyAsync(r =>
                r.CompanyID == companyId
                && r.Status == CompanyProfileUpdateRequestStatus.Pending
            );

            if (hasPendingUpdate)
            {
                return Conflict(
                    new
                    {
                        message =
                            "Hồ sơ nhà xe đang chờ duyệt. Vui lòng đợi SysAdmin xét duyệt.",
                    }
                );
            }

            return null;
        }

        private static bool IsValidPageSize(int pageSize)
        {
            return pageSize == 25 || pageSize == 50 || pageSize == 100 || pageSize == 200;
        }
    }
}
