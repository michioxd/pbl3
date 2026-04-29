using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Dtos
{
    public class ReviewBusAdminUpgradeRequestDto
    {
        [Required]
        public bool Approve { get; set; }

        [StringLength(1000)]
        public string? ReviewNote { get; set; }
    }

    public class BusAdminUpgradeRequestListItemDto
    {
        public Guid RequestID { get; set; }
        public Guid RequesterUserID { get; set; }
        public string? RequesterEmail { get; set; }
        public string? RequesterName { get; set; }
        public required string CompanyName { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public string? Reason { get; set; }
        public BusAdminUpgradeRequestStatus Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNote { get; set; }
        public Guid? CompanyID { get; set; }
        public BusCompanyBasicDto? BusCompany { get; set; }
        public UserBasicDto? ReviewedBy { get; set; }
    }

    public class BusCompanyBasicDto
    {
        public Guid CompanyID { get; set; }
        public required string Name { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public bool IsApproved { get; set; }
    }

    public class UserBasicDto
    {
        public Guid UserID { get; set; }
        public required string Email { get; set; }
        public string? FullName { get; set; }
    }

    public class BusAdminUpgradeRequestListResponseDto
    {
        public List<BusAdminUpgradeRequestListItemDto> Records { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public int TotalPages { get; set; }
    }
}
