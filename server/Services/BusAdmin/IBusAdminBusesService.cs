using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services.BusAdmin
{
    public interface IBusAdminBusesService
    {
        // Access Validation Helper
        Task EnsureCompanyAccessAsync(Guid companyId);

        // Create & Delete
        Task CreateBusAsync(Guid companyId, CreateBusDto dto);
        Task DeleteBusAsync(Guid id, Guid companyId);
        Task<List<Guid>> CreateTripAsync(Guid companyId, CreateTripDto dto);
        Task DeleteTripAsync(Guid tripId, Guid companyId);
        Task<Guid> CreateSeatLayoutAsync(Guid busTypeId, CreateSeatLayoutDto dto, Guid companyId);
        Task DeleteSeatLayoutAsync(Guid layoutId, Guid companyId);

        // Get
        Task<object> GetCompanyBusesAsync(Guid companyId, int page, int pageSize);
        Task<object> GetBookedTicketsAsync(Guid companyId, TicketStatus? status, int page, int pageSize);
        Task<object> GetTripsAsync(Guid companyId, int? year, int? month, int page, int pageSize);
        Task<object> GetSeatLayoutsAsync(Guid busTypeId, Guid companyId, int page, int pageSize);
        Task<object> GetBusTypeAmenitiesAsync(Guid busTypeId, Guid companyId);
        Task<object> GetMonthlyTicketStatsAsync(Guid companyId, int year, int month);

        // Update
        Task UpdateBusAsync(Guid id, UpdateBusDto dto, Guid companyId);
        Task UpdateTripAsync(Guid tripId, UpdateTripDto dto, Guid companyId);
        Task UpdateBusTypeAmenitiesAsync(Guid busTypeId, UpdateBusTypeAmenitiesDto dto, Guid companyId);
        Task UpdateSeatLayoutAsync(Guid layoutId, UpdateSeatLayoutDto dto, Guid companyId);
    }
}
