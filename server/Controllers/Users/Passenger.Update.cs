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
            var userId = GetCurrentUserId();

            var passenger = await _context
                .Passengers.Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null)
                return NotFound();

            passenger.FullName = dto.FullName;
            passenger.PhoneNumber = dto.PhoneNumber;
            passenger.IdentityCard = dto.IdentityCard;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công." });
        }
    }
}
