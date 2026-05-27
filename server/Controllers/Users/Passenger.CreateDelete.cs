using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpPost("upgrade-requests/busadmin")]
        public async Task<IActionResult> CreateBusAdminUpgradeRequest(
            [FromBody] CreateBusAdminUpgradeRequestDto dto
        )
        {
            var userId = GetCurrentUserId();
            var result = await _passengersService.CreateBusAdminUpgradeRequestAsync(dto, userId);
            return StatusCode(StatusCodes.Status201Created, result);
        }
    }
}
