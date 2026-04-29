using System.ComponentModel.DataAnnotations;
using Pbl3.Enums;

namespace Pbl3.Dtos
{
    // List item for table
    public class AdminCompanyListItemDto
    {
        public Guid CompanyID { get; set; }
        public required string Name { get; set; }
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public int Status { get; set; } // Enum as int for frontend
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
        public int AdminsCount { get; set; }
        public int RoutesCount { get; set; }
        public int BusesCount { get; set; }
        public int ActiveTripsCount { get; set; }
        public bool CanBeDeleted { get; set; }
    }

    // Summary statistics
    public class AdminCompanySummaryDto
    {
        public int TotalCompanies { get; set; }
        public int PendingCompanies { get; set; }
        public int ApprovedCompanies { get; set; }
        public int SuspendedCompanies { get; set; }
        public int RejectedCompanies { get; set; }
    }

    // Paginated list response
    public class AdminCompaniesListResponseDto
    {
        public List<AdminCompanyListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int FilteredCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public AdminCompanySummaryDto Summary { get; set; } = new();
    }

    // Bulk action request
    public class BulkCompanyActionDto
    {
        [Required]
        public List<Guid> CompanyIds { get; set; } = new();
    }

    // Status change request
    public class UpdateCompanyStatusDto
    {
        [Required]
        public int Status { get; set; }
        public string? Notes { get; set; }
    }
}
