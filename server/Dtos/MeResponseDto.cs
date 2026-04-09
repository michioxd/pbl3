namespace Pbl3.Dtos
{
    public class MeResponseDto
    {
        public MePassengerDto Passenger { get; set; } = new();
        public MeUserInfoDto? User { get; set; }
    }

    public class MePassengerDto
    {
        public Guid PassengerID { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class MeUserInfoDto
    {
        public Guid UserID { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public MeUserRoleDto? Role { get; set; }
    }

    public class MeUserRoleDto
    {
        public Guid RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }
}
