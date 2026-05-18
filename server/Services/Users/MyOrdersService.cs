using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;

namespace Pbl3.Services
{
    public interface IMyOrdersService
    {
        Task<MyOrdersResponseDto?> GetMyOrdersAsync(Guid userId);
    }

    public class MyOrdersService : IMyOrdersService
    {
        private readonly ApplicationDbContext _context;

        public MyOrdersService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MyOrdersResponseDto?> GetMyOrdersAsync(Guid userId)
        {
            var passengerId = await _context
                .Passengers.AsNoTracking()
                .Where(p => p.UserID == userId)
                .Select(p => p.PassengerID)
                .FirstOrDefaultAsync();

            if (passengerId == Guid.Empty)
            {
                return null;
            }

            var now = DateTime.UtcNow;

            var tickets = await _context
                .Tickets.AsNoTracking()
                .Where(t => t.PassengerID == passengerId)
                .Select(t => new OrderTicketDto
                {
                    TicketID = t.TicketID,
                    TicketCode = t.TicketCode,
                    Status = t.Status.ToString(),
                    FinalPrice = t.FinalPrice,
                    SeatLabel = t.SeatLayout != null ? t.SeatLayout.SeatLabel : null,
                    RouteName =
                        t.Trip != null && t.Trip.Route != null ? t.Trip.Route.RouteName : null,
                    DepartureTime = t.Trip != null ? t.Trip.DepartureTime : default,
                })
                .ToListAsync();

            var response = new MyOrdersResponseDto
            {
                Booked = tickets
                    //.Where(t => t.Status == "Issued" && t.DepartureTime > now)
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Completed = tickets
                    .Where(t =>
                        t.Status == "CheckedIn" || (t.Status == "Issued" && t.DepartureTime <= now)
                    )
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
                Cancelled = tickets
                    .Where(t => t.Status == "Cancelled")
                    .OrderByDescending(t => t.DepartureTime)
                    .ToList(),
            };

            return response;
        }
    }
}
