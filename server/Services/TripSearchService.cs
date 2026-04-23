using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services
{
    public interface ITripSearchService
    {
        Task<TripSearchResult> SearchTripsAsync(TripSearchQuery request);
    }

    public class TripSearchService : ITripSearchService
    {
        private static readonly TimeRangeFilter[] OrderedTimeRanges =
        [
            TimeRangeFilter.EarlyMorning,
            TimeRangeFilter.Morning,
            TimeRangeFilter.Afternoon,
            TimeRangeFilter.Evening,
        ];

        private readonly ApplicationDbContext _context;

        public TripSearchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TripSearchResult> SearchTripsAsync(TripSearchQuery request)
        {
            var page = request.Page <= 0 ? 1 : request.Page;
            var pageSize = request.PageSize <= 0 ? 20 : request.PageSize;
            var utcNow = DateTime.UtcNow;

            var baseTrips = _context
                .Trips.AsNoTracking()
                .Where(t => t.Status == TripStatus.Scheduled)
                .Where(t => t.DepartureDate == request.DepartureDate)
                .Where(t => t.Route != null && t.Route.IsActive)
                .Where(t => t.Route!.BusCompany != null && t.Route.BusCompany.IsApproved)
                .Where(t => t.BusType != null)
                .Where(t => t.Route!.DepartureProvinceCode == request.FromProvinceCode)
                .Where(t => t.Route!.ArrivalProvinceCode == request.ToProvinceCode);

            if (!string.IsNullOrWhiteSpace(request.FromDistrictCode))
            {
                baseTrips = baseTrips.Where(t =>
                    t.Route!.DepartureDistrictCode == request.FromDistrictCode
                );
            }

            if (!string.IsNullOrWhiteSpace(request.FromWardCode))
            {
                baseTrips = baseTrips.Where(t =>
                    t.Route!.DepartureWardCode == request.FromWardCode
                );
            }

            if (!string.IsNullOrWhiteSpace(request.ToDistrictCode))
            {
                baseTrips = baseTrips.Where(t =>
                    t.Route!.ArrivalDistrictCode == request.ToDistrictCode
                );
            }

            if (!string.IsNullOrWhiteSpace(request.ToWardCode))
            {
                baseTrips = baseTrips.Where(t => t.Route!.ArrivalWardCode == request.ToWardCode);
            }

            var projectedTrips = baseTrips.Select(t => new TripSearchProjection
            {
                TripId = t.TripID,
                RouteId = t.RouteID,
                CompanyId = t.Route!.CompanyID,
                BusCompanyName = t.Route.BusCompany!.Name,
                BusTypeName = t.BusType!.Name,
                RouteName = t.Route.RouteName,
                DepartureTime = t.DepartureTime,
                ArrivalTime = t.ArrivalTime,
                TotalSeats = t.BusType.TotalSeats,
                SoldSeats = t.Tickets.Count(ticket => ticket.Status != TicketStatus.Cancelled),
                HeldSeats = t.SeatHolds.Count(hold =>
                    hold.Status == SeatHoldStatus.Held && hold.ExpiresAt > utcNow
                ),
                LowestPrice =
                    t.Tickets.Where(ticket => ticket.Status != TicketStatus.Cancelled)
                        .Select(ticket => (decimal?)ticket.FinalPrice)
                        .Min()
                    ?? 0,
                Rating = t.Reviews.Select(review => (double?)review.RatingScore).Average() ?? 0,
                ReviewCount = t.Reviews.Count(),
                DepartureProvinceCode = t.Route.DepartureProvinceCode,
                DepartureDistrictCode = t.Route.DepartureDistrictCode,
                DepartureWardCode = t.Route.DepartureWardCode,
                DepartureLocation =
                    t.Route.BusRouteStops.Where(stop => stop.IsPickUp)
                        .OrderBy(stop => stop.StopOrder)
                        .Select(stop => stop.Station!.Name)
                        .FirstOrDefault()
                    ?? string.Empty,
                ArrivalProvinceCode = t.Route.ArrivalProvinceCode,
                ArrivalDistrictCode = t.Route.ArrivalDistrictCode,
                ArrivalWardCode = t.Route.ArrivalWardCode,
                ArrivalLocation =
                    t.Route.BusRouteStops.Where(stop => stop.IsDropOff)
                        .OrderByDescending(stop => stop.StopOrder)
                        .Select(stop => stop.Station!.Name)
                        .FirstOrDefault()
                    ?? string.Empty,
                BusTypeAmenityIds = t.BusType!.BusTypeAmenities.Select(bta => bta.AmenityID).ToList(),
                ImageUrl =
                    t.Bus != null
                        ? t
                            .Bus.BusImages.OrderBy(image => image.ImageID)
                            .Select(image => image.ImageURL)
                            .FirstOrDefault()
                        : null,
            });

            if (request.BusCompanyIds?.Count > 0)
            {
                projectedTrips = projectedTrips.Where(trip =>
                    request.BusCompanyIds.Contains(trip.CompanyId)
                );
            }

            if (request.MinPrice.HasValue)
            {
                projectedTrips = projectedTrips.Where(trip =>
                    trip.LowestPrice >= request.MinPrice.Value
                );
            }

            if (request.MaxPrice.HasValue)
            {
                projectedTrips = projectedTrips.Where(trip =>
                    trip.LowestPrice <= request.MaxPrice.Value
                );
            }

            var projectedTripList = await projectedTrips.ToListAsync();

            if (request.DepartureTimeRanges?.Count > 0)
            {
                projectedTripList = projectedTripList
                    .Where(trip =>
                        request.DepartureTimeRanges.Any(range =>
                            MatchesTimeRange(trip.DepartureTime, range)
                        )
                    )
                    .ToList();
            }

            if (request.AmenityIds is { Count: > 0 })
            {
                projectedTripList = projectedTripList
                    .Where(trip =>
                        request.AmenityIds.All(amenityId => trip.BusTypeAmenityIds.Contains(amenityId))
                    )
                    .ToList();
            }

            var total = projectedTripList.Count;
            var filters = await BuildFiltersAsync(projectedTripList);
            var summary = await BuildSummaryAsync(request);

            var orderedTrips = ApplySorting(projectedTripList, request.SortBy);
            var pagedTrips = orderedTrips
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var allAmenityIds = pagedTrips
                .SelectMany(trip => trip.BusTypeAmenityIds)
                .Distinct()
                .ToList();

            var amenities = await _context.Amenities
                .AsNoTracking()
                .Where(a => allAmenityIds.Contains(a.AmenityID) && a.IsActive)
                .ToDictionaryAsync(a => a.AmenityID);

            var items = pagedTrips
                .Select(trip => new TripSearchItemDto
                {
                    TripId = trip.TripId,
                    RouteId = trip.RouteId,
                    CompanyId = trip.CompanyId,
                    BusCompanyName = trip.BusCompanyName,
                    BusTypeName = trip.BusTypeName,
                    RouteName = trip.RouteName,
                    DepartureLocation = trip.DepartureLocation,
                    ArrivalLocation = trip.ArrivalLocation,
                    DepartureTime = trip.DepartureTime,
                    ArrivalTime = trip.ArrivalTime,
                    DurationMinutes = Math.Max(
                        0,
                        (int)Math.Round((trip.ArrivalTime - trip.DepartureTime).TotalMinutes)
                    ),
                    LowestPrice = trip.LowestPrice,
                    AvailableSeats = Math.Max(
                        0,
                        trip.TotalSeats - trip.SoldSeats - trip.HeldSeats
                    ),
                    Rating = trip.Rating,
                    ReviewCount = trip.ReviewCount,
                    Amenities = trip.BusTypeAmenityIds
                        .Where(id => amenities.ContainsKey(id))
                        .Select(id => amenities[id])
                        .OrderBy(a => a.DisplayOrder)
                        .Select(a => new AmenityDto
                        {
                            AmenityId = a.AmenityID,
                            Name = a.Name,
                            Description = a.Description,
                            IconName = a.IconName,
                            Category = a.Category,
                        })
                        .ToList(),
                    ImageUrl = trip.ImageUrl,
                })
                .ToList();

            return new TripSearchResult
            {
                TotalResults = total,
                Page = page,
                PageSize = pageSize,
                Summary = summary,
                Filters = filters,
                Items = items,
            };
        }

        private static bool MatchesTimeRange(DateTime departureTime, TimeRangeFilter range)
        {
            var time = departureTime.TimeOfDay;

            return range switch
            {
                TimeRangeFilter.EarlyMorning => time >= TimeSpan.Zero
                    && time < TimeSpan.FromHours(6),
                TimeRangeFilter.Morning => time >= TimeSpan.FromHours(6)
                    && time < TimeSpan.FromHours(12),
                TimeRangeFilter.Afternoon => time >= TimeSpan.FromHours(12)
                    && time < TimeSpan.FromHours(18),
                TimeRangeFilter.Evening => time >= TimeSpan.FromHours(18)
                    && time < TimeSpan.FromHours(24),
                _ => false,
            };
        }

        private static List<TripSearchProjection> ApplySorting(
            IEnumerable<TripSearchProjection> trips,
            TripSortBy sortBy
        )
        {
            return sortBy switch
            {
                TripSortBy.EarliestDeparture => trips.OrderBy(trip => trip.DepartureTime).ToList(),
                TripSortBy.LatestDeparture => trips
                    .OrderByDescending(trip => trip.DepartureTime)
                    .ToList(),
                TripSortBy.HighestRating => trips
                    .OrderByDescending(trip => trip.Rating)
                    .ThenBy(trip => trip.DepartureTime)
                    .ToList(),
                TripSortBy.PriceAsc => trips
                    .OrderBy(trip => trip.LowestPrice)
                    .ThenBy(trip => trip.DepartureTime)
                    .ToList(),
                TripSortBy.PriceDesc => trips
                    .OrderByDescending(trip => trip.LowestPrice)
                    .ThenBy(trip => trip.DepartureTime)
                    .ToList(),
                _ => trips.OrderBy(trip => trip.DepartureTime).ToList(),
            };
        }

        private async Task<TripSearchFilterMetadataDto> BuildFiltersAsync(
            IEnumerable<TripSearchProjection> trips
        )
        {
            var tripList = trips.ToList();
            var prices = tripList.Select(trip => trip.LowestPrice).ToList();

            var allAmenityIds = tripList
                .SelectMany(trip => trip.BusTypeAmenityIds)
                .Distinct()
                .ToList();

            var amenities = await _context.Amenities
                .AsNoTracking()
                .Where(a => allAmenityIds.Contains(a.AmenityID) && a.IsActive)
                .ToDictionaryAsync(a => a.AmenityID);

            return new TripSearchFilterMetadataDto
            {
                BusCompanies = tripList
                    .GroupBy(trip => new { trip.CompanyId, trip.BusCompanyName })
                    .Select(group => new TripSearchCompanyFilterOptionDto
                    {
                        CompanyId = group.Key.CompanyId,
                        Name = group.Key.BusCompanyName,
                        Count = group.Count(),
                    })
                    .OrderBy(option => option.Name)
                    .ToList(),
                DepartureTimeRanges = OrderedTimeRanges
                    .Select(range => new TripSearchTimeRangeFilterOptionDto
                    {
                        Value = range,
                        Count = tripList.Count(trip => MatchesTimeRange(trip.DepartureTime, range)),
                    })
                    .Where(option => option.Count > 0)
                    .ToList(),
                Amenities = tripList
                    .SelectMany(trip => trip.BusTypeAmenityIds)
                    .Where(id => amenities.ContainsKey(id))
                    .GroupBy(id => id)
                    .Select(group => new TripSearchAmenityFilterOptionDto
                    {
                        Amenity = new AmenityDto
                        {
                            AmenityId = amenities[group.Key].AmenityID,
                            Name = amenities[group.Key].Name,
                            Description = amenities[group.Key].Description,
                            IconName = amenities[group.Key].IconName,
                            Category = amenities[group.Key].Category,
                        },
                        Count = group.Count(),
                    })
                    .OrderBy(option => option.Amenity.Category)
                    .ThenBy(option => option.Amenity.Name)
                    .ToList(),
                PriceRange =
                    prices.Count == 0
                        ? null
                        : new TripSearchPriceRangeDto { Min = prices.Min(), Max = prices.Max() },
            };
        }

        private async Task<TripSearchSummaryDto> BuildSummaryAsync(TripSearchQuery request)
        {
            return new TripSearchSummaryDto
            {
                Origin = await BuildLocationSummaryAsync(
                    request.FromProvinceCode,
                    request.FromDistrictCode,
                    request.FromWardCode
                ),
                Destination = await BuildLocationSummaryAsync(
                    request.ToProvinceCode,
                    request.ToDistrictCode,
                    request.ToWardCode
                ),
                DepartureDate = request.DepartureDate,
            };
        }

        private async Task<TripSearchLocationSummaryDto> BuildLocationSummaryAsync(
            string provinceCode,
            string? districtCode,
            string? wardCode
        )
        {
            var province = await _context
                .Provinces.AsNoTracking()
                .Where(item => item.Code == provinceCode)
                .Select(item => new { item.Code, item.Name })
                .FirstOrDefaultAsync();

            var district = string.IsNullOrWhiteSpace(districtCode)
                ? null
                : await _context
                    .Districts.AsNoTracking()
                    .Where(item => item.Code == districtCode)
                    .Select(item => new { item.Code, item.Name })
                    .FirstOrDefaultAsync();

            var ward = string.IsNullOrWhiteSpace(wardCode)
                ? null
                : await _context
                    .Wards.AsNoTracking()
                    .Where(item => item.Code == wardCode)
                    .Select(item => new { item.Code, item.Name })
                    .FirstOrDefaultAsync();

            var parts = new[] { ward?.Name, district?.Name, province?.Name }.Where(value =>
                !string.IsNullOrWhiteSpace(value)
            );

            return new TripSearchLocationSummaryDto
            {
                ProvinceCode = provinceCode,
                DistrictCode = districtCode,
                WardCode = wardCode,
                DisplayName = string.Join(", ", parts),
            };
        }

        private sealed class TripSearchProjection
        {
            public Guid TripId { get; set; }

            public Guid RouteId { get; set; }

            public Guid CompanyId { get; set; }

            public string BusCompanyName { get; set; } = string.Empty;

            public string BusTypeName { get; set; } = string.Empty;

            public string RouteName { get; set; } = string.Empty;

            public DateTime DepartureTime { get; set; }

            public DateTime ArrivalTime { get; set; }

            public int TotalSeats { get; set; }

            public int SoldSeats { get; set; }

            public int HeldSeats { get; set; }

            public decimal LowestPrice { get; set; }

            public double Rating { get; set; }

            public int ReviewCount { get; set; }

            public string? DepartureProvinceCode { get; set; }

            public string? DepartureDistrictCode { get; set; }

            public string? DepartureWardCode { get; set; }

            public string DepartureLocation { get; set; } = string.Empty;

            public string? ArrivalProvinceCode { get; set; }

            public string? ArrivalDistrictCode { get; set; }

            public string? ArrivalWardCode { get; set; }

            public string ArrivalLocation { get; set; } = string.Empty;

            public List<Guid> BusTypeAmenityIds { get; set; } = [];

            public string? ImageUrl { get; set; }
        }
    }
}
