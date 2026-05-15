using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services
{
    public interface ITripDetailService
    {
        Task<TripDetailDto?> GetTripDetailAsync(Guid tripId);
    }

    public class TripDetailService : ITripDetailService
    {
        private readonly ApplicationDbContext _context;

        public TripDetailService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TripDetailDto?> GetTripDetailAsync(Guid tripId)
        {
            var utcNow = DateTime.UtcNow;

            var trip = await _context
                .Trips.AsNoTracking()
                .Where(t => t.TripID == tripId)
                .Select(t => new
                {
                    t.TripID,
                    t.RouteID,
                    t.DepartureDate,
                    t.DepartureTime,
                    t.ArrivalTime,
                    t.Status,
                    t.BasePrice,
                    t.CancellationPolicy,
                    t.Notes,
                    CompanyId = t.Route!.CompanyID,
                    BusCompanyName = t.Route.BusCompany!.Name,
                    BusTypeName = t.BusType!.Name,
                    BusTypeDescription = t.BusType.Description,
                    BusTypeAmenityIds = t
                        .BusType.BusTypeAmenities.Select(bta => bta.AmenityID)
                        .ToList(),
                    RouteName = t.Route.RouteName,
                    TotalSeats = t.BusType.TotalSeats,
                    SoldSeats = t.Tickets.Count(ticket => ticket.Status != TicketStatus.Cancelled),
                    HeldSeats = t.SeatHolds.Count(hold =>
                        hold.Status == SeatHoldStatus.Held && hold.ExpiresAt > utcNow
                    ),
                    LowestPrice = t.Tickets.Where(ticket => ticket.Status != TicketStatus.Cancelled)
                        .Select(ticket => (decimal?)ticket.FinalPrice)
                        .Min()
                        ?? 0,
                    Rating = t.Reviews.Select(review => (double?)review.RatingScore).Average() ?? 0,
                    ReviewCount = t.Reviews.Count(),
                    Images = t.Bus != null
                        ? t
                            .Bus.BusImages.OrderBy(img => img.ImageID)
                            .Select(img => img.ImageURL)
                            .ToList()
                        : new List<string>(),
                    RouteStops = t
                        .Route.BusRouteStops.Select(stop => new
                        {
                            stop.StationID,
                            StationName = stop.Station!.Name,
                            stop.Station.ProvinceCode,
                            stop.Station.DistrictCode,
                            stop.Station.WardCode,
                            stop.Station.AddressDetail,
                            stop.StopOrder,
                            stop.IsPickUp,
                            stop.IsDropOff,
                            stop.DurationFromStart,
                        })
                        .ToList(),
                })
                .FirstOrDefaultAsync();

            if (trip == null || trip.Status != TripStatus.Scheduled)
            {
                return null;
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

            return result;
        }
    }
}
