using Pbl3.Enums;

namespace Pbl3.Utils
{
    public static class AmenityHelper
    {
        public static readonly Dictionary<AmenityType, AmenityMetadata> Metadata =
            new()
            {
                // Comfort
                [AmenityType.AirConditioning] = new("Điều hòa", "air-conditioning", "comfort"),
                [AmenityType.Recliner] = new("Ghế nằm", "recliner", "comfort"),
                [AmenityType.Blanket] = new("Chăn", "blanket", "comfort"),
                [AmenityType.Pillow] = new("Gối", "pillow", "comfort"),
                // Entertainment
                [AmenityType.Wifi] = new("Wifi", "wifi", "entertainment"),
                [AmenityType.TV] = new("TV", "tv", "entertainment"),
                [AmenityType.Music] = new("Nhạc", "music", "entertainment"),
                [AmenityType.Charging] = new("Sạc điện thoại", "charging", "entertainment"),
                // Service
                [AmenityType.Water] = new("Nước uống", "water", "service"),
                [AmenityType.Snack] = new("Snack", "snack", "service"),
                [AmenityType.Meal] = new("Bữa ăn", "meal", "service"),
                [AmenityType.Toilet] = new("Toilet", "toilet", "service"),
                [AmenityType.Attendant] = new("Phục vụ", "attendant", "service"),
                // Safety
                [AmenityType.Seatbelt] = new("Dây an toàn", "seatbelt", "safety"),
                [AmenityType.FirstAid] = new("Y tế", "first-aid", "safety"),
                [AmenityType.FireExtinguisher] = new(
                    "Bình chữa cháy",
                    "fire-extinguisher",
                    "safety"
                ),
            };

        public static string GetDisplayName(AmenityType type)
        {
            return Metadata.TryGetValue(type, out var meta) ? meta.DisplayName : type.ToString();
        }

        public static string GetIconName(AmenityType type)
        {
            return Metadata.TryGetValue(type, out var meta) ? meta.IconName : "";
        }

        public static string GetCategory(AmenityType type)
        {
            return Metadata.TryGetValue(type, out var meta) ? meta.Category : "";
        }
    }

    public record AmenityMetadata(string DisplayName, string IconName, string Category);
}
