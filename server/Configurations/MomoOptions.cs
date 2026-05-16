namespace Pbl3.Configurations
{
    public class MomoOptions
    {
        public string PartnerCode { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public string RedirectUrl { get; set; } = string.Empty;
        public string FrontendRedirectUrl { get; set; } = string.Empty;
        public string IpnUrl { get; set; } = string.Empty;
        public string PartnerName { get; set; } = string.Empty;
        public string StoreId { get; set; } = string.Empty;
        public string RequestType { get; set; } = "captureWallet";
        public string Lang { get; set; } = "vi";
    }
}
