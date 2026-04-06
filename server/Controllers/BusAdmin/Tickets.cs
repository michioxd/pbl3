using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;

namespace Pbl3.Controllers.BusAdmin
{
    [ApiController]
    [Route("api/busadmin/tickets")]
    // [Authorize(Roles = "BusAdmin")] // Mở comment này khi đã set up Auth và JWT
    public class TicketsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TicketsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Tạm thời truyền adminId qua route param để test.
        // Sau này khi có JWT, bạn sẽ lấy UserID từ Claims (User.FindFirstValue(ClaimTypes.NameIdentifier)) thay vì truyền từ ngoài vào.
        [AllowAnonymous]
        [HttpGet("admin/{adminId}")]
        public async Task<IActionResult> GetTicketsForAdmin(Guid adminId)
        {
            // 1. Tìm nhà xe (CompanyID) mà User này đang làm Admin
            var adminProfile = await _context.BusCompanyAdmins.FirstOrDefaultAsync(a =>
                a.UserID == adminId
            );

            if (adminProfile == null)
            {
                return NotFound(
                    new { message = "Không tìm thấy hồ sơ quản lý nhà xe cho user này." }
                );
            }

            var companyId = adminProfile.CompanyID;

            // 2. Lấy danh sách các vé thuộc các chuyến đi của nhà xe này
            // Logic: Ticket -> Trip -> Route -> CompanyID
            var tickets = await _context
                .Tickets.Include(t => t.Passenger)
                .Include(t => t.SeatLayout)
                .Include(t => t.Booking)
                .Include(t => t.Trip)
                    .ThenInclude(tr => tr!.Route) // Để join qua Route kiểm tra CompanyID
                .Where(t =>
                    t.Trip != null && t.Trip.Route != null && t.Trip.Route.CompanyID == companyId
                )
                .Select(t => new
                {
                    TicketID = t.TicketID,
                    TicketCode = t.TicketCode,
                    QrCode = t.QrCode,
                    FinalPrice = t.FinalPrice,
                    Status = t.Status,
                    Passenger = new
                    {
                        Name = t.Passenger != null ? t.Passenger.FullName : "Unknown",
                        Phone = t.Passenger != null ? t.Passenger.PhoneNumber : "Unknown",
                    },
                    Seat = t.SeatLayout != null ? t.SeatLayout.SeatLabel : "Unknown",
                    Trip = new
                    {
                        TripID = t.Trip!.TripID,
                        RouteName = t.Trip.Route!.RouteName,
                        DepartureDate = t.Trip.DepartureDate,
                        DepartureTime = t.Trip.DepartureTime,
                    },
                    BookingDate = t.Booking != null ? t.Booking.CreatedAt : default,
                })
                .OrderByDescending(t => t.BookingDate) // Xếp vé mới đặt lên đầu
                .ToListAsync();

            return Ok(
                new
                {
                    AdminID = adminId,
                    CompanyID = companyId,
                    TotalTickets = tickets.Count,
                    Tickets = tickets,
                }
            );
        }
    }
}
