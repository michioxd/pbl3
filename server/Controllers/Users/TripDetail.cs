using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Dtos;
using Pbl3.Services;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/trips")]
    [Tags("Trips")]
    public class TripDetailController : ControllerBase
    {
        private readonly ITripDetailService _tripDetailService;

        public TripDetailController(ITripDetailService tripDetailService)
        {
            _tripDetailService = tripDetailService;
        }

        [HttpGet("{tripId:guid}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(TripDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTripDetail(Guid tripId)
        {
            var result = await _tripDetailService.GetTripDetailAsync(tripId);

            if (result == null)
            {
                return NotFound(new { message = "Trip not found or not available" });
            }

            var amenities = await _context
                .Amenities.AsNoTracking()
                .Where(a => trip.BusTypeAmenityIds.Contains(a.AmenityID) && a.IsActive)
                .OrderBy(a => a.DisplayOrder)
                .Select(a => new AmenityDto
                {
                    AmenityId = a.AmenityID,
                    Name = a.Name,
                    Description = a.Description,
                    IconName = a.IconName,
                    Category = a.Category,
                })
                .ToListAsync();

            var pickupStops = trip
                .RouteStops.Where(stop => stop.IsPickUp)
                .OrderBy(stop => stop.StopOrder)
                .Select(stop => new TripDetailRouteStopDto
                {
                    StationId = stop.StationID,
                    StationName = stop.StationName,
                    ProvinceCode = stop.ProvinceCode,
                    DistrictCode = stop.DistrictCode,
                    WardCode = stop.WardCode,
                    AddressDetail = stop.AddressDetail,
                    StopOrder = stop.StopOrder,
                    IsPickUp = stop.IsPickUp,
                    IsDropOff = stop.IsDropOff,
                    DurationFromStart = stop.DurationFromStart,
                })
                .ToList();

            var dropoffStops = trip
                .RouteStops.Where(stop => stop.IsDropOff)
                .OrderBy(stop => stop.StopOrder)
                .Select(stop => new TripDetailRouteStopDto
                {
                    StationId = stop.StationID,
                    StationName = stop.StationName,
                    ProvinceCode = stop.ProvinceCode,
                    DistrictCode = stop.DistrictCode,
                    WardCode = stop.WardCode,
                    AddressDetail = stop.AddressDetail,
                    StopOrder = stop.StopOrder,
                    IsPickUp = stop.IsPickUp,
                    IsDropOff = stop.IsDropOff,
                    DurationFromStart = stop.DurationFromStart,
                })
                .ToList();

            var result = new TripDetailDto
            {
                TripId = trip.TripID,
                RouteId = trip.RouteID,
                CompanyId = trip.CompanyId,
                BusCompanyName = trip.BusCompanyName,
                BusTypeName = trip.BusTypeName,
                BusTypeDescription = trip.BusTypeDescription,
                RouteName = trip.RouteName,
                DepartureDate = trip.DepartureDate,
                DepartureTime = trip.DepartureTime,
                ArrivalTime = trip.ArrivalTime,
                DurationMinutes = Math.Max(
                    0,
                    (int)Math.Round((trip.ArrivalTime - trip.DepartureTime).TotalMinutes)
                ),
                TotalSeats = trip.TotalSeats,
                AvailableSeats = Math.Max(0, trip.TotalSeats - trip.SoldSeats - trip.HeldSeats),
                BasePrice = trip.BasePrice,
                LowestPrice = trip.LowestPrice,
                Rating = trip.Rating,
                ReviewCount = trip.ReviewCount,
                Amenities = amenities,
                Images = trip.Images,
                PickupStops = pickupStops,
                DropoffStops = dropoffStops,
                CancellationPolicy = trip.CancellationPolicy,
                Notes = trip.Notes,
            };

            return Ok(result);
        }

        [HttpGet("{tripId:guid}/seats")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<TripSeatDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTripSeats(Guid tripId)
        {
            var trip = await _context
                .Trips.AsNoTracking()
                .Where(t => t.TripID == tripId)
                .Select(t => new
                {
                    t.TripID,
                    t.BusTypeID,
                    t.Status,
                })
                .FirstOrDefaultAsync();

            if (trip == null)
            {
                return NotFound(new { message = "Trip not found" });
            }

            if (trip.Status != TripStatus.Scheduled)
            {
                return NotFound(new { message = "Trip is not available" });
            }

            return Ok(await BuildTripSeatsAsync(trip.TripID, trip.BusTypeID, DateTime.UtcNow));
        }

        private async Task<List<TripSeatDto>> BuildTripSeatsAsync(
            Guid tripId,
            Guid busTypeId,
            DateTime utcNow
        )
        {
            var unavailableSeatIds = await _context
                .Tickets.AsNoTracking()
                .Where(ticket =>
                    ticket.TripID == tripId
                    && (
                        ticket.Status == TicketStatus.Issued
                        || ticket.Status == TicketStatus.CheckedIn
                    )
                )
                .Select(ticket => ticket.SeatLayoutID)
                .Concat(
                    _context
                        .SeatHolds.AsNoTracking()
                        .Where(hold =>
                            hold.TripID == tripId
                            && hold.Status == SeatHoldStatus.Held
                            && hold.ExpiresAt > utcNow
                        )
                        .Select(hold => hold.SeatLayoutID)
                )
                .Distinct()
                .ToListAsync();

            return await _context
                .SeatLayouts.AsNoTracking()
                .Where(layout => layout.BusTypeID == busTypeId)
                .OrderBy(layout => layout.Floor)
                .ThenBy(layout => layout.PositionY)
                .ThenBy(layout => layout.PositionX)
                .Select(layout => new TripSeatDto
                {
                    LayoutId = layout.LayoutID,
                    SeatLabel = layout.SeatLabel,
                    Floor = layout.Floor,
                    SeatType = layout.SeatType,
                    PositionX = layout.PositionX,
                    PositionY = layout.PositionY,
                    IsAvailable = !unavailableSeatIds.Contains(layout.LayoutID),
                })
                .ToListAsync();
        }
    }
}
