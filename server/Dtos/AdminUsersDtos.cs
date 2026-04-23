using System.ComponentModel.DataAnnotations;

namespace Pbl3.Dtos
{
    public class AdminUserListItemDto
    {
        public Guid Id { get; set; }
        public Guid? PassengerId { get; set; }
        public required string Email { get; set; }
        public required string FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public required string Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int BookingCount { get; set; }
        public int TicketCount { get; set; }
        public int NotificationCount { get; set; }
        public int UpgradeRequestCount { get; set; }
        public int ManagedCompanyCount { get; set; }
        public bool CanBeDeleted { get; set; }
    }

    public class AdminUsersSummaryDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
        public int PassengerUsers { get; set; }
        public int BusAdminUsers { get; set; }
        public int SysAdminUsers { get; set; }
    }

    public class AdminUsersListResponseDto
    {
        public List<AdminUserListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int FilteredCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public AdminUsersSummaryDto Summary { get; set; } = new();
    }

    public class AdminCreateUserDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [Required]
        public string Role { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
    }

    public class AdminUpdateUserDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [Required]
        public string Role { get; set; } = string.Empty;

        public bool IsActive { get; set; }
    }
}
