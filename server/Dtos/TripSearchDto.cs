using System;

namespace Pbl3.Dtos
{
    public class TripSearchDto
    {
        public Guid TripId { get; set; }

        public string BusCompanyName { get; set; } = default!;
        public string Origin { get; set; } = default!;
        public string Destination { get; set; } = default!;
        public DateTime DepartureTime { get; set; }
        public decimal Price { get; set; }
        public int AvailableSeats { get; set; }
        public double Score { get; set; }
    }
}
