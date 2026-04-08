using System;


namespace Pbl3.Dtos
{
    public class UpdatePassengerDto
    {
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
    }
}