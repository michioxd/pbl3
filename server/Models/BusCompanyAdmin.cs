using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pbl3.Enums;

namespace Pbl3.Models
{
    public class BusCompanyAdmin
    {
        private const char OwnerCode = 'O';
        private const char AdminCode = 'A';

        private static readonly IReadOnlyDictionary<char, BusCompanyPermission> PermissionCodeMap =
            new Dictionary<char, BusCompanyPermission>
            {
                ['R'] = BusCompanyPermission.RouteManagement,
                ['T'] = BusCompanyPermission.TicketManagement,
                ['B'] = BusCompanyPermission.BusManagement,
                ['S'] = BusCompanyPermission.StaffManagement,
                ['P'] = BusCompanyPermission.PromotionManagement,
                ['F'] = BusCompanyPermission.FinanceManagement,
            };

        private string _roles = string.Empty;

        [Key]
        public Guid UserID { get; set; }
        public User? User { get; set; }

        public Guid CompanyID { get; set; }
        public BusCompany? BusCompany { get; set; }

        /// <summary>
        /// Compact permission string.
        /// O = Owner, A = Admin, child permissions: R = Route, T = Ticket, B = Bus.
        /// Additional codes are placeholders and can be expanded later.
        /// </summary>
        public string Roles
        {
            get => _roles;
            set => _roles = NormalizeRoles(value);
        }

        [NotMapped]
        public bool IsOwner => _roles.Contains(OwnerCode);

        [NotMapped]
        public bool IsAdmin => IsOwner || _roles.Contains(AdminCode);

        [NotMapped]
        public IReadOnlyCollection<char> RoleCodes => _roles.ToCharArray();

        [NotMapped]
        public IReadOnlyCollection<BusCompanyPermission> Permissions => ResolvePermissions();

        public bool HasRoleCode(char roleCode)
        {
            var normalizedCode = char.ToUpperInvariant(roleCode);

            return normalizedCode switch
            {
                OwnerCode => IsOwner,
                AdminCode => IsAdmin,
                _ => _roles.Contains(normalizedCode),
            };
        }

        public bool HasPermission(BusCompanyPermission permission)
        {
            if (IsOwner || IsAdmin)
            {
                return true;
            }

            foreach (var entry in PermissionCodeMap)
            {
                if (entry.Value == permission && _roles.Contains(entry.Key))
                {
                    return true;
                }
            }

            return false;
        }

        public bool HasPermissionCode(char permissionCode)
        {
            var normalizedCode = char.ToUpperInvariant(permissionCode);
            var hasMappedPermissionCode =
                PermissionCodeMap.ContainsKey(normalizedCode) && _roles.Contains(normalizedCode);

            return IsOwner || IsAdmin || hasMappedPermissionCode;
        }

        public static IReadOnlyDictionary<char, BusCompanyPermission> GetPermissionMappings()
        {
            return PermissionCodeMap;
        }

        private IReadOnlyCollection<BusCompanyPermission> ResolvePermissions()
        {
            if (IsOwner || IsAdmin)
            {
                return Enum.GetValues<BusCompanyPermission>();
            }

            return PermissionCodeMap
                .Where(entry => _roles.Contains(entry.Key))
                .Select(entry => entry.Value)
                .Distinct()
                .ToArray();
        }

        private static string NormalizeRoles(string? roles)
        {
            if (string.IsNullOrWhiteSpace(roles))
            {
                return string.Empty;
            }

            var normalizedCodes = roles
                .Where(char.IsLetter)
                .Select(char.ToUpperInvariant)
                .Distinct()
                .ToHashSet();

            if (normalizedCodes.Contains(OwnerCode))
            {
                return OwnerCode.ToString();
            }

            var orderedCodes = new List<char>();

            if (normalizedCodes.Remove(AdminCode))
            {
                orderedCodes.Add(AdminCode);
            }

            foreach (var code in PermissionCodeMap.Keys.Order())
            {
                if (normalizedCodes.Remove(code))
                {
                    orderedCodes.Add(code);
                }
            }

            orderedCodes.AddRange(normalizedCodes.Order());
            return new string(orderedCodes.ToArray());
        }
    }
}
