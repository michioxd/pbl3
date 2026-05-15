using Pbl3.Enums;

namespace Pbl3.Dtos
{
    public class CreateCompanyProfileUpdateRequestDto
    {
        public string Name { get; set; } = null!;
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
    }

    public class CompanyProfileUpdateRequestDto
    {
        public Guid RequestID { get; set; }
        public Guid CompanyID { get; set; }
        public CompanyProfileUpdateRequestStatus Status { get; set; }
        public string Name { get; set; } = null!;
        public string? LicenseNumber { get; set; }
        public string? Hotline { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewNote { get; set; }
    }

    public class ReviewCompanyProfileUpdateRequestDto
    {
        public CompanyProfileUpdateRequestStatus Status { get; set; }
        public string? ReviewNote { get; set; }
    }
}
