using System.Security.Cryptography;
using System.Text;

namespace Pbl3.Utils
{
    public static class MomoSignatureHelper
    {
        public static string ComputeHmacSha256(string secretKey, string rawData)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var rawBytes = Encoding.UTF8.GetBytes(rawData);
            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(rawBytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }
    }
}
