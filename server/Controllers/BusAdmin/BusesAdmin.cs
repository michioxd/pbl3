using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Data;
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

        public BusesController(
            ApplicationDbContext context,
            ICurrentUserContext currentUserContext,
            IBusAdminOwnershipService ownershipService
        )
        {
            _context = context;
            _currentUserContext = currentUserContext;
            _ownershipService = ownershipService;
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

        private static bool IsValidPageSize(int pageSize)
        {
            return pageSize == 25 || pageSize == 50 || pageSize == 100 || pageSize == 200;
        }
    }
}
