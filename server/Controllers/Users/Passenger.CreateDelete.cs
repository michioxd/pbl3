using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpPost("upgrade-requests/busadmin")]
        public async Task<IActionResult> CreateBusAdminUpgradeRequest(
            [FromBody] CreateBusAdminUpgradeRequestDto dto
        )
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _passengerService.CreateBusAdminUpgradeRequestAsync(userId, dto);

            if (result.StatusCode == 201)
                return StatusCode(201, result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
