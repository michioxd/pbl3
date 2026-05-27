using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Services.Admin;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public partial class SystemAdminManagementController : ControllerBase
    {
        private readonly ISystemAdminManagementService _service;

        public SystemAdminManagementController(ISystemAdminManagementService service)
        {
            _service = service;
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
