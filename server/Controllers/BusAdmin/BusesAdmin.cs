using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/buses")]
    [Authorize(Policy = "ModOrAdmin")]
    public partial class BusesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BusesController(ApplicationDbContext context)
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

        private async Task<Guid?> GetCurrentCompanyIdAsync()
        {
            var userId = GetCurrentUserId();

            return await _context
                .BusCompanyAdmins.Where(x => x.UserID == userId)
                .Select(x => (Guid?)x.CompanyID)
                .FirstOrDefaultAsync();
        }

        private Task<bool> IsRouteOwnedByCompanyAsync(Guid companyId, Guid routeId)
        {
            return _context.BusRoutes.AnyAsync(r => r.RouteID == routeId && r.CompanyID == companyId);
        }

        private Task<bool> IsBusOwnedByCompanyAsync(Guid companyId, Guid busId)
        {
            return _context.Buses.AnyAsync(b => b.BusID == busId && b.CompanyID == companyId);
        }

        private Task<bool> IsTripOwnedByCompanyAsync(Guid companyId, Guid tripId)
        {
            return _context.Trips.AnyAsync(t => t.TripID == tripId && t.Route != null && t.Route.CompanyID == companyId);
        }

        private Task<bool> IsBusTypeOwnedByCompanyAsync(Guid companyId, Guid busTypeId)
        {
            return _context.Buses.AnyAsync(b => b.CompanyID == companyId && b.BusTypeID == busTypeId);
        }
    }
}
