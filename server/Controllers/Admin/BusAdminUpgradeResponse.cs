using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Services;
using Pbl3.Services.Admin;

namespace Pbl3.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/system/upgrade-requests")]
    [Authorize(Policy = "AdminOnly")]
    [Tags("SystemAdmin")]
    public partial class BusAdminUpgradeResponse(
        IBusAdminUpgradeResponseService upgradeService,
        ICurrentUserContext currentUserContext
    ) : ControllerBase
    {
        private readonly IBusAdminUpgradeResponseService _upgradeService = upgradeService;
        private readonly ICurrentUserContext _currentUserContext = currentUserContext;
    }
}
