using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/passenger")]
    [Authorize(Roles = "Passenger")] // Chỉ cho phép user có Role là Passenger truy cập
    public class PassengersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PassengersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // --- HÀM HỖ TRỢ LẤY USER ID TỪ TOKEN ---
        private Guid GetCurrentUserId()
        {
            // Lấy ID từ claim "sub" mà bạn đã setup trong AuthController
            var userIdString = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                            
            if (Guid.TryParse(userIdString, out Guid userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Không tìm thấy UserID trong token.");
        }

        // --- 1. LẤY THÔNG TIN CÁ NHÂN CỦA PASSENGER ---
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();

            var passenger = await _context.Passengers
                .Include(p => p.User)
                .Where(p => p.UserID == userId)
                .Select(p => new
                {
                    p.PassengerID,
                    p.FullName,
                    p.Email,
                    p.PhoneNumber,
                    p.IdentityCard,
                    Username = p.User != null ? p.User.Username : null
                })
                .FirstOrDefaultAsync();

            if (passenger == null) return NotFound(new { message = "Không tìm thấy hồ sơ hành khách." });

            return Ok(passenger);
        }

        // --- 2. LẤY LỊCH SỬ ĐẶT VÉ (Ví dụ) ---
        [HttpGet("tickets")]
        public async Task<IActionResult> GetMyTickets()
        {
            var userId = GetCurrentUserId();

            // Tìm PassengerID của User này trước
            var passenger = await _context.Passengers.FirstOrDefaultAsync(p => p.UserID == userId);
            if (passenger == null) return NotFound(new { message = "Hành khách không tồn tại." });

            // Truy vấn danh sách vé dựa trên PassengerID
            // Giả sử bạn có bảng Tickets có khóa ngoại PassengerID
            var tickets = await _context.Tickets
                .Include(t => t.Trip)
                    .ThenInclude(tr => tr!.Route)
                .Include(t => t.SeatLayout)
                .Where(t => t.PassengerID == passenger.PassengerID)
                .Select(t => new
                {
                    t.TicketID,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    Price = t.FinalPrice,
                    t.Status,
                    RouteName = t.Trip != null && t.Trip.Route != null ? t.Trip.Route.RouteName : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default
                })
                .ToListAsync();

            return Ok(tickets);
        }

        // --- 3. CẬP NHẬT THÔNG TIN CÁ NHÂN ---
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePassengerDto dto)
        {
            var userId = GetCurrentUserId();

            var passenger = await _context.Passengers
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserID == userId);

            if (passenger == null) return NotFound();

            // Cập nhật các trường cho phép
            passenger.FullName = dto.FullName;
            passenger.PhoneNumber = dto.PhoneNumber;
            passenger.IdentityCard = dto.IdentityCard;
            
            // Xử lý logic khác nếu có update User liên quan...
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công." });
        }
    }

    // DTO dùng cho update
    public class UpdatePassengerDto
    {
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? IdentityCard { get; set; }
    }
}