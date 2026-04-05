using System;

namespace Pbl3.Dtos
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public required string Email { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Role { get; set; }
        public bool IsActive { get; set; }
    }
}
