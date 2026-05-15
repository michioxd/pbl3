namespace Pbl3.Dtos
{
    public class AmenityDto
    {
        public Guid AmenityId { get; set; }

        public string Name { get; set; } = default!;

        public string? Description { get; set; }

        public string IconName { get; set; } = default!;

        public string Category { get; set; } = default!;
    }
}
