using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _passengerService.GetProfileAsync(userId);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }

        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _passengerService.GetMyTicketsAsync(userId);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
