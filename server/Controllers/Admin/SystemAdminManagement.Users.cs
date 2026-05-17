using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Controllers.Admin
{
    public partial class SystemAdminManagementController
    {
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? q,
            [FromQuery] List<string>? roles,
            [FromQuery] List<string>? statuses,
            [FromQuery] string? role,
            [FromQuery] bool? isActive,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25
        )
        {
            if (page < 1)
            {
                return BadRequest(new { message = "page phải lớn hơn hoặc bằng 1." });
            }

            if (pageSize != 25 && pageSize != 50 && pageSize != 100 && pageSize != 200)
            {
                return BadRequest(new { message = "pageSize chỉ chấp nhận: 25, 50, 100, 200." });
            }

            var normalizedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (roles != null)
            {
                foreach (
                    var rawRole in roles.SelectMany(r =>
                        r.Split(
                            ',',
                            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
                        )
                    )
                )
                {
                    if (!TryNormalizeUserRole(rawRole, out var parsedRole))
                    {
                        return BadRequest(new { message = "Vai trò không hợp lệ." });
                    }

                    normalizedRoles.Add(parsedRole);
                }
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                if (!TryNormalizeUserRole(role, out var parsedRole))
                {
                    return BadRequest(new { message = "Vai trò không hợp lệ." });
                }

                normalizedRoles.Add(parsedRole);
            }

            var normalizedStatuses = new HashSet<bool>();

            if (statuses != null)
            {
                foreach (
                    var rawStatus in statuses.SelectMany(status =>
                        status.Split(
                            ',',
                            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
                        )
                    )
                )
                {
                    switch (rawStatus.Trim().ToLowerInvariant())
                    {
                        case "active":
                            normalizedStatuses.Add(true);
                            break;
                        case "inactive":
                            normalizedStatuses.Add(false);
                            break;
                        default:
                            return BadRequest(new { message = "Trạng thái không hợp lệ." });
                    }
                }
            }

            if (isActive.HasValue)
            {
                normalizedStatuses.Add(isActive.Value);
            }

            var baseQuery = _context.Users.AsNoTracking().Include(u => u.Role).AsQueryable();
            var totalCount = await baseQuery.CountAsync();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var keyword = $"%{q.Trim()}%";
                baseQuery = baseQuery.Where(u =>
                    EF.Functions.ILike(u.Email, keyword)
                    || (u.FullName != null && EF.Functions.ILike(u.FullName, keyword))
                    || (u.PhoneNumber != null && EF.Functions.ILike(u.PhoneNumber, keyword))
                );
            }

            if (normalizedRoles.Count > 0)
            {
                baseQuery = baseQuery.Where(u =>
                    u.Role != null && normalizedRoles.Contains(u.Role.RoleName)
                );
            }

            if (normalizedStatuses.Count > 0)
            {
                baseQuery = baseQuery.Where(u => normalizedStatuses.Contains(u.IsActive));
            }

            var filteredCount = await baseQuery.CountAsync();
            var totalPages =
                filteredCount == 0 ? 1 : (int)Math.Ceiling(filteredCount / (double)pageSize);
            var safePage = Math.Min(page, totalPages);

            var isDescending = !string.Equals(
                sortDirection,
                "asc",
                StringComparison.OrdinalIgnoreCase
            );

            baseQuery = (sortBy ?? string.Empty).ToLowerInvariant() switch
            {
                "nguoidung" => isDescending
                    ? baseQuery
                        .OrderByDescending(u => u.FullName ?? u.Email)
                        .ThenByDescending(u => u.Email)
                    : baseQuery.OrderBy(u => u.FullName ?? u.Email).ThenBy(u => u.Email),
                "vaitro" => isDescending
                    ? baseQuery.OrderByDescending(u =>
                        u.Role != null ? u.Role.RoleName : string.Empty
                    )
                    : baseQuery.OrderBy(u => u.Role != null ? u.Role.RoleName : string.Empty),
                "trangthai" => isDescending
                    ? baseQuery.OrderByDescending(u => u.IsActive)
                    : baseQuery.OrderBy(u => u.IsActive),
                _ => isDescending
                    ? baseQuery.OrderByDescending(u => u.CreatedAt)
                    : baseQuery.OrderBy(u => u.CreatedAt),
            };

            var filteredUsers = await baseQuery
                .Skip((safePage - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.UserID,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    Role = u.Role != null ? u.Role.RoleName : string.Empty,
                    u.IsActive,
                    u.CreatedAt,
                })
                .ToListAsync();

            var userIds = filteredUsers.Select(u => u.UserID).ToList();

            var passengerMap = new Dictionary<Guid, Guid>();
            if (userIds.Count > 0)
            {
                var passengers = await _context
                    .Passengers.AsNoTracking()
                    .Where(p => p.UserID.HasValue && userIds.Contains(p.UserID.Value))
                    .Select(p => new { UserId = p.UserID!.Value, p.PassengerID })
                    .ToListAsync();

                passengerMap = passengers
                    .GroupBy(p => p.UserId)
                    .ToDictionary(g => g.Key, g => g.First().PassengerID);
            }

            var bookingCounts = await _context
                .Bookings.AsNoTracking()
                .Where(b => b.UserID.HasValue && userIds.Contains(b.UserID.Value))
                .GroupBy(b => b.UserID!.Value)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var ticketCounts = await _context
                .Passengers.AsNoTracking()
                .Where(p => p.UserID.HasValue && userIds.Contains(p.UserID.Value))
                .SelectMany(p => p.Tickets, (p, t) => new { UserId = p.UserID!.Value, t.TicketID })
                .GroupBy(x => x.UserId)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var notificationCounts = await _context
                .Notifications.AsNoTracking()
                .Where(n => userIds.Contains(n.UserID))
                .GroupBy(n => n.UserID)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var requesterCounts = await _context
                .BusAdminUpgradeRequests.AsNoTracking()
                .Where(r => userIds.Contains(r.RequesterUserID))
                .GroupBy(r => r.RequesterUserID)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var reviewedRequestUserIds = await _context
                .BusAdminUpgradeRequests.AsNoTracking()
                .Where(r =>
                    r.ReviewedByUserID.HasValue && userIds.Contains(r.ReviewedByUserID.Value)
                )
                .Select(r => r.ReviewedByUserID!.Value)
                .Distinct()
                .ToListAsync();

            var managedCompanyCounts = await _context
                .BusCompanyAdmins.AsNoTracking()
                .Where(bca => userIds.Contains(bca.UserID))
                .GroupBy(bca => bca.UserID)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.UserId, x => x.Count);

            var blockedDeleteIds = new HashSet<Guid>(bookingCounts.Keys);
            blockedDeleteIds.UnionWith(ticketCounts.Keys);
            blockedDeleteIds.UnionWith(requesterCounts.Keys);
            blockedDeleteIds.UnionWith(reviewedRequestUserIds);

            var items = filteredUsers
                .Select(u => new AdminUserListItemDto
                {
                    Id = u.UserID,
                    PassengerId = passengerMap.GetValueOrDefault(u.UserID),
                    Email = u.Email,
                    FullName = string.IsNullOrWhiteSpace(u.FullName) ? u.Email : u.FullName,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    BookingCount = bookingCounts.GetValueOrDefault(u.UserID),
                    TicketCount = ticketCounts.GetValueOrDefault(u.UserID),
                    NotificationCount = notificationCounts.GetValueOrDefault(u.UserID),
                    UpgradeRequestCount = requesterCounts.GetValueOrDefault(u.UserID),
                    ManagedCompanyCount = managedCompanyCounts.GetValueOrDefault(u.UserID),
                    CanBeDeleted = !blockedDeleteIds.Contains(u.UserID),
                })
                .ToList();

            var allUsers = await _context
                .Users.AsNoTracking()
                .Include(u => u.Role)
                .Select(u => new
                {
                    u.IsActive,
                    Role = u.Role != null ? u.Role.RoleName : string.Empty,
                })
                .ToListAsync();

            var summary = new AdminUsersSummaryDto
            {
                TotalUsers = allUsers.Count,
                ActiveUsers = allUsers.Count(u => u.IsActive),
                InactiveUsers = allUsers.Count(u => !u.IsActive),
                PassengerUsers = allUsers.Count(u => u.Role == UserRole.Passenger.ToString()),
                BusAdminUsers = allUsers.Count(u => u.Role == UserRole.BusAdmin.ToString()),
                SysAdminUsers = allUsers.Count(u => u.Role == UserRole.SysAdmin.ToString()),
            };

            return Ok(
                new AdminUsersListResponseDto
                {
                    Items = items,
                    TotalCount = totalCount,
                    FilteredCount = filteredCount,
                    Page = safePage,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    Summary = summary,
                }
            );
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserDto dto)
        {
            if (!TryNormalizeUserRole(dto.Role, out var normalizedRole))
            {
                return BadRequest(new { message = "Vai trò không hợp lệ." });
            }

            var email = dto.Email.Trim().ToLower();
            var fullName = dto.FullName.Trim();
            var phoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber)
                ? null
                : dto.PhoneNumber.Trim();

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == email);
            if (emailExists)
            {
                return BadRequest(new { message = "Email đã tồn tại." });
            }

            var roleEntity = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == normalizedRole
            );
            if (roleEntity == null)
            {
                return BadRequest(new { message = "Không tìm thấy vai trò trong hệ thống." });
            }

            var user = new User
            {
                UserID = Guid.NewGuid(),
                Email = email,
                FullName = fullName,
                PhoneNumber = phoneNumber,
                RoleID = roleEntity.RoleID,
                IsActive = dto.IsActive,
                PasswordHash = string.Empty,
                CreatedAt = DateTime.UtcNow,
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            await SyncPassengerProfileAsync(user, normalizedRole);
            await _context.SaveChangesAsync();

            var createdUser = await GetAdminUserListItemAsync(user.UserID);
            return Ok(createdUser);
        }

        [HttpPut("users/{userId:guid}")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] AdminUpdateUserDto dto)
        {
            var user = await _context
                .Users.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            if (!TryNormalizeUserRole(dto.Role, out var normalizedRole))
            {
                return BadRequest(new { message = "Vai trò không hợp lệ." });
            }

            var currentUserId = GetCurrentUserId();
            if (
                user.UserID == currentUserId
                && (!dto.IsActive || normalizedRole != UserRole.SysAdmin.ToString())
            )
            {
                return BadRequest(
                    new { message = "Không thể tự khóa hoặc tự hạ quyền tài khoản của chính mình." }
                );
            }

            var email = dto.Email.Trim().ToLower();
            var emailExists = await _context.Users.AnyAsync(u =>
                u.UserID != userId && u.Email.ToLower() == email
            );
            if (emailExists)
            {
                return BadRequest(new { message = "Email đã tồn tại." });
            }

            var roleEntity = await _context.Roles.FirstOrDefaultAsync(r =>
                r.RoleName == normalizedRole
            );
            if (roleEntity == null)
            {
                return BadRequest(new { message = "Không tìm thấy vai trò trong hệ thống." });
            }

            user.Email = email;
            user.FullName = dto.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber)
                ? null
                : dto.PhoneNumber.Trim();
            user.RoleID = roleEntity.RoleID;
            user.IsActive = dto.IsActive;

            await SyncPassengerProfileAsync(user, normalizedRole);
            await _context.SaveChangesAsync();

            var updatedUser = await GetAdminUserListItemAsync(userId);
            return Ok(updatedUser);
        }

        [HttpDelete("users/{userId:guid}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            if (userId == GetCurrentUserId())
            {
                return BadRequest(new { message = "Không thể xóa tài khoản đang đăng nhập." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            var passengerId = passenger?.PassengerID;

            var hasBookings = await _context.Bookings.AnyAsync(b => b.UserID == userId);
            var hasTickets =
                passengerId.HasValue
                && await _context.Tickets.AnyAsync(t => t.PassengerID == passengerId.Value);
            var hasUpgradeRequests = await _context.BusAdminUpgradeRequests.AnyAsync(r =>
                r.RequesterUserID == userId || r.ReviewedByUserID == userId
            );

            if (hasBookings || hasTickets || hasUpgradeRequests)
            {
                return BadRequest(
                    new
                    {
                        message = "Người dùng đã phát sinh dữ liệu giao dịch hoặc lịch sử xét duyệt nên không thể xóa. Hãy khóa tài khoản thay vì xóa.",
                    }
                );
            }

            var companyAdmins = await _context
                .BusCompanyAdmins.Where(bca => bca.UserID == userId)
                .ToListAsync();
            var notifications = await _context
                .Notifications.Where(n => n.UserID == userId)
                .ToListAsync();
            var seatHolds = await _context.SeatHolds.Where(sh => sh.UserID == userId).ToListAsync();

            if (companyAdmins.Count > 0)
            {
                _context.BusCompanyAdmins.RemoveRange(companyAdmins);
            }

            if (notifications.Count > 0)
            {
                _context.Notifications.RemoveRange(notifications);
            }

            if (seatHolds.Count > 0)
            {
                _context.SeatHolds.RemoveRange(seatHolds);
            }

            if (passenger != null)
            {
                _context.Passengers.Remove(passenger);
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa người dùng thành công." });
        }

        private static bool TryNormalizeUserRole(string? role, out string normalizedRole)
        {
            if (Enum.TryParse<UserRole>(role?.Trim(), true, out var parsedRole))
            {
                normalizedRole = parsedRole.ToString();
                return true;
            }

            normalizedRole = string.Empty;
            return false;
        }

        private async Task SyncPassengerProfileAsync(User user, string normalizedRole)
        {
            var passenger = await _context.Passengers.FirstOrDefaultAsync(p =>
                p.UserID == user.UserID
            );

            if (normalizedRole == UserRole.Passenger.ToString())
            {
                if (passenger == null)
                {
                    _context.Passengers.Add(
                        new Passenger
                        {
                            PassengerID = Guid.NewGuid(),
                            UserID = user.UserID,
                            FullName = user.FullName ?? user.Email,
                            PhoneNumber = user.PhoneNumber,
                            Email = user.Email,
                        }
                    );

                    return;
                }
            }

            if (passenger != null)
            {
                passenger.FullName = user.FullName ?? user.Email;
                passenger.PhoneNumber = user.PhoneNumber;
                passenger.Email = user.Email;
            }
        }

        private async Task<AdminUserListItemDto> GetAdminUserListItemAsync(Guid userId)
        {
            var user = await _context
                .Users.AsNoTracking()
                .Include(u => u.Role)
                .Where(u => u.UserID == userId)
                .Select(u => new
                {
                    u.UserID,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    Role = u.Role != null ? u.Role.RoleName : string.Empty,
                    u.IsActive,
                    u.CreatedAt,
                })
                .FirstAsync();

            var passenger = await _context
                .Passengers.AsNoTracking()
                .Where(p => p.UserID == userId)
                .Select(p => new { p.PassengerID })
                .FirstOrDefaultAsync();

            var bookingCount = await _context.Bookings.CountAsync(b => b.UserID == userId);
            var ticketCount =
                passenger == null
                    ? 0
                    : await _context.Tickets.CountAsync(t =>
                        t.PassengerID == passenger.PassengerID
                    );
            var notificationCount = await _context.Notifications.CountAsync(n =>
                n.UserID == userId
            );
            var upgradeRequestCount = await _context.BusAdminUpgradeRequests.CountAsync(r =>
                r.RequesterUserID == userId
            );
            var managedCompanyCount = await _context.BusCompanyAdmins.CountAsync(bca =>
                bca.UserID == userId
            );
            var hasReviewedRequest = await _context.BusAdminUpgradeRequests.AnyAsync(r =>
                r.ReviewedByUserID == userId
            );

            return new AdminUserListItemDto
            {
                Id = user.UserID,
                PassengerId = passenger?.PassengerID,
                Email = user.Email,
                FullName = string.IsNullOrWhiteSpace(user.FullName) ? user.Email : user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                BookingCount = bookingCount,
                TicketCount = ticketCount,
                NotificationCount = notificationCount,
                UpgradeRequestCount = upgradeRequestCount,
                ManagedCompanyCount = managedCompanyCount,
                CanBeDeleted =
                    bookingCount == 0
                    && ticketCount == 0
                    && upgradeRequestCount == 0
                    && !hasReviewedRequest,
            };
        }
    }
}
