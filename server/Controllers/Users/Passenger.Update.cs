using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePassengerDto dto)
        {
            var userId = _currentUserContext.GetRequiredUserId();
            var result = await _passengerService.UpdateProfileAsync(userId, dto);

            if (result.StatusCode == 200)
                return Ok(result.Data);

            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        }
    }
}
