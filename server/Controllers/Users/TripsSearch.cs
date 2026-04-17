using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/trips/search")]
    [Tags("Search")]
    public class TripsSearchController : ControllerBase
    {
        private readonly ITripSearchService _searchService;

        public TripsSearchController(ITripSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? origin,
            [FromQuery] string? destination,
            [FromQuery] DateTime? departureDate)
        {
            if (string.IsNullOrWhiteSpace(origin) || string.IsNullOrWhiteSpace(destination))
            {
                return BadRequest(new { message = "Origin and destination are required." });
            }

            if (departureDate == null)
            {
                return BadRequest(new { message = "Departure date is required." });
            }

            // Treat the incoming date as UTC for safe comparison with PostgreSQL timestamptz.
            var departureDateUtc = DateTime.SpecifyKind(departureDate.Value, DateTimeKind.Utc);

            try
            {
                var results = await _searchService.SearchTripsAsync(origin, destination, departureDateUtc);
                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while searching for trips.", details = ex.Message });
            }
        }
    }

    public interface ITripSearchService
    {
        Task<List<TripSearchDto>> SearchTripsAsync(string origin, string destination, DateTime departureDateUtc);
    }

    public class TripSearchService : ITripSearchService
    {
        private readonly ApplicationDbContext _context;

        public TripSearchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TripSearchDto>> SearchTripsAsync(string origin, string destination, DateTime departureDateUtc)
        {
            var nowUtc = DateTime.UtcNow;
            var originFilter = origin?.Trim() ?? string.Empty;
            var destinationFilter = destination?.Trim() ?? string.Empty;

            if (string.IsNullOrEmpty(originFilter) || string.IsNullOrEmpty(destinationFilter))
            {
                return new List<TripSearchDto>();
            }

            var dayStartUtc = departureDateUtc.Date;
            var dayEndUtc = dayStartUtc.AddDays(1);

            // Build search patterns for case-insensitive route matching in PostgreSQL.
            var originPattern = EscapeLikePattern(originFilter);
            var destinationPattern = EscapeLikePattern(destinationFilter);

            var candidateTrips = await _context.Trips
                .AsNoTracking()
                .Where(t => t.Route != null && t.Route.RouteName != null)
                .Where(t => t.Route.BusCompany != null)
                .Where(t => t.BusType != null)
                //.Where(t => t.DepartureTime >= nowUtc)
                //.Where(t => t.DepartureTime >= dayStartUtc && t.DepartureTime < dayEndUtc)
                .Where(t => t.DepartureTime.Date == departureDateUtc.Date)
                .Where(t => EF.Functions.ILike(t.Route.RouteName, $"%{originPattern}%")
                    || EF.Functions.ILike(t.Route.RouteName, $"%{destinationPattern}%"))
                .Select(t => new
                {
                    t.TripID,
                    t.DepartureTime,
                    RouteName = t.Route!.RouteName,
                    CompanyName = t.Route.BusCompany!.Name,
                    TotalSeats = t.BusType!.TotalSeats,
                    SoldSeatCount = t.Tickets.Count(ticket => ticket.Status != TicketStatus.Cancelled),
                    Price = t.Tickets
                        .Where(ticket => ticket.Status != TicketStatus.Cancelled)
                        .OrderBy(ticket => ticket.FinalPrice)
                        .Select(ticket => (decimal?)ticket.FinalPrice)
                        .FirstOrDefault()
                })
                .Where(t => t.SoldSeatCount < t.TotalSeats)
                .ToListAsync();

            // Normalize search terms once, then rank results by relevance.
            var normalizedOrigin = NormalizeText(originFilter);
            var normalizedDestination = NormalizeText(destinationFilter);

            var scoredTrips = candidateTrips
                .Select(t =>
                {
                    var routeScore = CalculateRouteScore(t.RouteName, normalizedOrigin, normalizedDestination);
                    if (routeScore == 0)
                    {
                        return null;
                    }

                    var (parsedOrigin, parsedDestination) = ParseRouteStops(t.RouteName);
                    var availableSeats = Math.Max(0, t.TotalSeats - t.SoldSeatCount);
                    var score = routeScore;

                    return new TripSearchDto
                    {
                        TripId = t.TripID,
                        BusCompanyName = t.CompanyName,
                        Origin = parsedOrigin,
                        Destination = parsedDestination,
                        DepartureTime = DateTime.SpecifyKind(t.DepartureTime, DateTimeKind.Utc),
                        Price = t.Price ?? 0m,
                        AvailableSeats = availableSeats,
                        Score = score
                    };
                })
                .Where(result => result != null)
                .Cast<TripSearchDto>()
                .OrderByDescending(result => result.Score)
                .ThenBy(result => result.DepartureTime)
                .Take(20)
                .ToList();

            return scoredTrips;
        }

        private static int CalculateRouteScore(string routeName, string normalizedOrigin, string normalizedDestination)
        {
            var normalizedRouteName = NormalizeText(routeName);
            var exactRoute = $"{normalizedOrigin} - {normalizedDestination}";

            if (normalizedRouteName.Equals(exactRoute, StringComparison.Ordinal))
            {
                return 100;
            }

            var originMatches = normalizedRouteName.Contains(normalizedOrigin, StringComparison.Ordinal);
            var destinationMatches = normalizedRouteName.Contains(normalizedDestination, StringComparison.Ordinal);

            if (originMatches && destinationMatches)
            {
                return 50;
            }

            return originMatches || destinationMatches ? 25 : 0;
        }

        private static (string Origin, string Destination) ParseRouteStops(string routeName)
        {
            var parts = routeName.Split('-', StringSplitOptions.RemoveEmptyEntries)
                .Select(part => part.Trim())
                .ToArray();

            return parts.Length >= 2
                ? (parts[0], parts[1])
                : (routeName.Trim(), string.Empty);
        }

        private static string NormalizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var normalized = text.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();

            foreach (var c in normalized)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(c);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        }

        private static string EscapeLikePattern(string value)
        {
            return value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
        }
    }
}
