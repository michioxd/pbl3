using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Pbl3.Dtos
{
    public class WardResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = default!;

        [JsonPropertyName("name")]
        public string Name { get; set; } = default!;

        [JsonPropertyName("name_en")]
        public string NameEn { get; set; } = default!;
    }

    public class DistrictResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = default!;

        [JsonPropertyName("name")]
        public string Name { get; set; } = default!;

        [JsonPropertyName("name_en")]
        public string NameEn { get; set; } = default!;

        [JsonPropertyName("wards")]
        public List<WardResponse> Wards { get; set; } = new List<WardResponse>();
    }

    public class ProvinceResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = default!;

        [JsonPropertyName("name")]
        public string Name { get; set; } = default!;

        [JsonPropertyName("name_en")]
        public string NameEn { get; set; } = default!;

        [JsonPropertyName("districts")]
        public List<DistrictResponse> Districts { get; set; } = new List<DistrictResponse>();
    }
}
