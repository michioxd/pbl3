using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;

namespace Pbl3.Services
{
    public interface ICurrentUserContext
    {
        Guid GetRequiredUserId();
    }

    public class CurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

        public Guid GetRequiredUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var userIdString =
                user?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdString, out var userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Không tìm thấy UserID trong token.");
        }
    }

    public interface IBusAdminOwnershipService
    {
        Task<Guid?> GetCurrentCompanyIdAsync(Guid userId);
        Task<bool> IsRouteOwnedByCompanyAsync(Guid companyId, Guid routeId);
        Task<bool> IsBusOwnedByCompanyAsync(Guid companyId, Guid busId);
        Task<bool> IsTripOwnedByCompanyAsync(Guid companyId, Guid tripId);
        Task<bool> IsBusTypeOwnedByCompanyAsync(Guid companyId, Guid busTypeId);
        Task<bool> IsBusTypeExistsAsync(Guid busTypeId);
    }

    public class BusAdminOwnershipService(ApplicationDbContext context) : IBusAdminOwnershipService
    {
        private readonly ApplicationDbContext _context = context;

        public async Task<Guid?> GetCurrentCompanyIdAsync(Guid userId)
        {
            return await _context
                .BusCompanyAdmins.Where(x => x.UserID == userId)
                .Select(x => (Guid?)x.CompanyID)
                .FirstOrDefaultAsync();
        }

        public Task<bool> IsRouteOwnedByCompanyAsync(Guid companyId, Guid routeId)
        {
            return _context.BusRoutes.AnyAsync(r =>
                r.RouteID == routeId && r.CompanyID == companyId
            );
        }

        public Task<bool> IsBusOwnedByCompanyAsync(Guid companyId, Guid busId)
        {
            return _context.Buses.AnyAsync(b => b.BusID == busId && b.CompanyID == companyId);
        }

        public Task<bool> IsTripOwnedByCompanyAsync(Guid companyId, Guid tripId)
        {
            return _context.Trips.AnyAsync(t =>
                t.TripID == tripId && t.Route != null && t.Route.CompanyID == companyId
            );
        }

        public Task<bool> IsBusTypeOwnedByCompanyAsync(Guid companyId, Guid busTypeId)
        {
            return _context.Buses.AnyAsync(b =>
                b.CompanyID == companyId && b.BusTypeID == busTypeId
            );
        }

        public Task<bool> IsBusTypeExistsAsync(Guid busTypeId)
        {
            return _context.BusTypes.AnyAsync(bt => bt.BusTypeID == busTypeId);
        }
    }
}
