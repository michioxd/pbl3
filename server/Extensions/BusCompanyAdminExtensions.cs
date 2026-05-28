using System;
using System.Collections.Generic;
using System.Linq;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Extensions
{
    public static class BusCompanyAdminExtensions
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

        public static bool IsOwner(this BusCompanyAdmin admin)
        {
            return admin.Roles.Contains(OwnerCode);
        }

        public static bool IsAdmin(this BusCompanyAdmin admin)
        {
            return admin.IsOwner() || admin.Roles.Contains(AdminCode);
        }

        public static IReadOnlyCollection<char> GetRoleCodes(this BusCompanyAdmin admin)
        {
            return admin.Roles.ToCharArray();
        }

        public static IReadOnlyCollection<BusCompanyPermission> GetPermissions(this BusCompanyAdmin admin)
        {
            return admin.ResolvePermissions();
        }

        public static bool HasRoleCode(this BusCompanyAdmin admin, char roleCode)
        {
            var normalizedCode = char.ToUpperInvariant(roleCode);

            return normalizedCode switch
            {
                OwnerCode => admin.IsOwner(),
                AdminCode => admin.IsAdmin(),
                _ => admin.Roles.Contains(normalizedCode),
            };
        }

        public static bool HasPermission(this BusCompanyAdmin admin, BusCompanyPermission permission)
        {
            if (admin.IsOwner() || admin.IsAdmin())
            {
                return true;
            }

            foreach (var entry in PermissionCodeMap)
            {
                if (entry.Value == permission && admin.Roles.Contains(entry.Key))
                {
                    return true;
                }
            }

            return false;
        }

        public static bool HasPermissionCode(this BusCompanyAdmin admin, char permissionCode)
        {
            var normalizedCode = char.ToUpperInvariant(permissionCode);
            var hasMappedPermissionCode =
                PermissionCodeMap.ContainsKey(normalizedCode) && admin.Roles.Contains(normalizedCode);

            return admin.IsOwner() || admin.IsAdmin() || hasMappedPermissionCode;
        }

        public static IReadOnlyDictionary<char, BusCompanyPermission> GetPermissionMappings()
        {
            return PermissionCodeMap;
        }

        public static string NormalizeRoles(string? roles)
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

        private static IReadOnlyCollection<BusCompanyPermission> ResolvePermissions(this BusCompanyAdmin admin)
        {
            if (admin.IsOwner() || admin.IsAdmin())
            {
                return Enum.GetValues<BusCompanyPermission>();
            }

            return PermissionCodeMap
                .Where(entry => admin.Roles.Contains(entry.Key))
                .Select(entry => entry.Value)
                .Distinct()
                .ToArray();
        }
    }
}
