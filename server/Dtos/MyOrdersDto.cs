using System;
using System.Collections.Generic;

namespace Pbl3.Dtos
{
    public class MyOrdersResponseDto
    {
        public List<OrderTicketDto> Booked { get; set; } = new List<OrderTicketDto>();
        public List<OrderTicketDto> Completed { get; set; } = new List<OrderTicketDto>();
        public List<OrderTicketDto> Cancelled { get; set; } = new List<OrderTicketDto>();
    }

    public class OrderTicketDto
    {
        public Guid TicketID { get; set; }
        public string TicketCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal FinalPrice { get; set; }
        public string? SeatLabel { get; set; }
        public string? RouteName { get; set; }
        public DateTime DepartureTime { get; set; }
    }
}
