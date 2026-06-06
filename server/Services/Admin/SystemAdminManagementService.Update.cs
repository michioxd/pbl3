using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Pbl3.Dtos;
using Pbl3.Models;

namespace Pbl3.Services.Admin
{
    public partial class SystemAdminManagementService
    {
        public async Task UpdateBusAsync(Guid id, UpdateBusDto dto)
        {
            var bus = await _context.Buses.FirstOrDefaultAsync(b => b.BusID == id);
            if (bus == null)
                throw new KeyNotFoundException("Không tìm thấy xe.");

            var busTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!busTypeExists)
                throw new ArgumentException("Loại xe không tồn tại.");

            bus.PlateNumber = dto.PlateNumber;
            bus.IsActive = dto.IsActive;
            bus.BusTypeID = dto.BusTypeID;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateCompanyProfileAsync(Guid companyId, UpdateCompanyProfileDto dto)
        {
            var company = await _context.BusCompanies.FirstOrDefaultAsync(c =>
                c.CompanyID == companyId
            );
            if (company == null)
                throw new KeyNotFoundException("Không tìm thấy nhà xe.");

            company.Name = dto.Name;
            company.Hotline = dto.Hotline;
            company.LicenseNumber = dto.LicenseNumber;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateTripAsync(Guid tripId, UpdateTripDto dto)
        {
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.TripID == tripId);
            if (trip == null)
                throw new KeyNotFoundException("Không tìm thấy chuyến xe.");

            var route = await _context
                .BusRoutes.AsNoTracking()
                .Where(r => r.RouteID == dto.RouteID)
                .Select(r => new { r.RouteID, r.CompanyID })
                .FirstOrDefaultAsync();
            if (route == null)
                throw new ArgumentException("Tuyến đường không tồn tại.");

            if (dto.BusID.HasValue)
            {
                var isBusOwned = await IsBusOwnedByCompanyAsync(route.CompanyID, dto.BusID.Value);
                if (!isBusOwned)
                    throw new ArgumentException("Xe không thuộc nhà xe của tuyến đường.");
            }

            var busTypeExists = await IsBusTypeExistsAsync(dto.BusTypeID);
            if (!busTypeExists)
                throw new ArgumentException("Loại xe không tồn tại.");

            var parsedDepTime = TimeOnly.Parse(dto.DepartureTime);
            var parsedArrTime = TimeOnly.Parse(dto.ArrivalTime);
            var departureDateTime = dto.DepartureDate.ToDateTime(parsedDepTime);
            var arrivalDateTime = dto.DepartureDate.ToDateTime(parsedArrTime);
            if (arrivalDateTime < departureDateTime)
            {
                arrivalDateTime = arrivalDateTime.AddDays(1);
            }

            trip.RouteID = dto.RouteID;
            trip.BusID = dto.BusID;
            trip.BusTypeID = dto.BusTypeID;
            trip.DepartureDate = dto.DepartureDate;
            trip.DepartureTime = departureDateTime;
            trip.ArrivalTime = arrivalDateTime;
            trip.Status = dto.Status;

            await _context.SaveChangesAsync();
        }

        public async Task UpdateBusTypeAmenitiesAsync(Guid busTypeId, UpdateBusTypeAmenitiesDto dto)
        {
            var busType = await _context.BusTypes.FirstOrDefaultAsync(b =>
                b.BusTypeID == busTypeId
            );
            if (busType == null)
                throw new KeyNotFoundException("Không tìm thấy loại xe.");

            busType.Description = dto.Amenities;
            await _context.SaveChangesAsync();
        }

        public async Task UpdateSeatLayoutAsync(Guid layoutId, UpdateSeatLayoutDto dto)
        {
            var seatLayout = await _context.SeatLayouts.FirstOrDefaultAsync(s =>
                s.LayoutID == layoutId
            );
            if (seatLayout == null)
                throw new KeyNotFoundException("Không tìm thấy sơ đồ ghế.");

            seatLayout.SeatLabel = dto.SeatLabel;
            seatLayout.Floor = dto.Floor;
            seatLayout.SeatType = dto.SeatType;
            seatLayout.PositionX = dto.PositionX;
            seatLayout.PositionY = dto.PositionY;

            await _context.SaveChangesAsync();
        }
    }
}
