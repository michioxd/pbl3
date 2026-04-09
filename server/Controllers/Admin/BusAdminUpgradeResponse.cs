using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Data;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/bus-admin-upgrade-requests")]
    [Authorize(Policy = "AdminOnly")]
    public partial class BusAdminUpgradeResponse : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BusAdminUpgradeResponse(ApplicationDbContext context)
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

    }
}
