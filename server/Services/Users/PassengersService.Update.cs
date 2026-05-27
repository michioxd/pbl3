using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;

namespace Pbl3.Services.Users
{
    public partial class PassengersService
    {
        public async Task UpdateProfileAsync(UpdatePassengerDto dto, Guid userId)
        {
            var passenger = await _context
                .Passengers.Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null)
            {
                throw new KeyNotFoundException("Không tìm thấy hồ sơ hành khách.");
            }

            passenger.FullName = dto.FullName;
            passenger.PhoneNumber = dto.PhoneNumber;
            passenger.IdentityCard = dto.IdentityCard;

            await _context.SaveChangesAsync();
        }
    }
}
