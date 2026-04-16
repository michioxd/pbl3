using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public partial class SystemAdminManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SystemAdminManagementController(ApplicationDbContext context)
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

        private Task<bool> IsRouteOwnedByCompanyAsync(Guid companyId, Guid routeId)
        {
            return _context.BusRoutes.AnyAsync(r =>
                r.RouteID == routeId && r.CompanyID == companyId
            );
        }

        private Task<bool> IsBusOwnedByCompanyAsync(Guid companyId, Guid busId)
        {
            return _context.Buses.AnyAsync(b => b.BusID == busId && b.CompanyID == companyId);
        }

        private Task<bool> IsBusTypeExistsAsync(Guid busTypeId)
        {
            return _context.BusTypes.AnyAsync(bt => bt.BusTypeID == busTypeId);
        }
    }
}
