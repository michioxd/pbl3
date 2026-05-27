using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Services;
using Pbl3.Services.BusAdmin;
using System;
using System.Threading.Tasks;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/buses")]
    [Authorize(Policy = "BusAdmin")]
    [Tags("BusAdmin")]
    public partial class BusesController : ControllerBase
    {
        private readonly IBusAdminBusesService _busesService;
        private readonly IBusAdminProfileService _profileService;
        private readonly ICurrentUserContext _currentUserContext;
        private readonly IBusAdminOwnershipService _ownershipService;

        public BusesController(
            IBusAdminBusesService busesService,
            IBusAdminProfileService profileService,
            ICurrentUserContext currentUserContext,
            IBusAdminOwnershipService ownershipService
        )
        {
            _busesService = busesService;
            _profileService = profileService;
            _currentUserContext = currentUserContext;
            _ownershipService = ownershipService;
        }

        private async Task<Guid?> GetCurrentCompanyIdAsync()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            return await _ownershipService.GetCurrentCompanyIdAsync(userId);
        }
    }
}
