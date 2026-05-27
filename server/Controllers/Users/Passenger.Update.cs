using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using System.Threading.Tasks;

namespace Pbl3.Controllers.Users
{
    public partial class PassengersController
    {
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePassengerDto dto)
        {
            var userId = GetCurrentUserId();
            await _passengersService.UpdateProfileAsync(dto, userId);
            return Ok(new { message = "Cập nhật thành công." });
        }
    }
}
