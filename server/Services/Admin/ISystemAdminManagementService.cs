using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Pbl3.Dtos;
using Pbl3.Enums;

namespace Pbl3.Services.Admin
{
    public interface ISystemAdminManagementService
    {
        // Companies (Companies partial)
        Task<object> BulkApproveCompaniesAsync(List<Guid> companyIds, Guid reviewerId);
        Task<object> BulkSuspendCompaniesAsync(List<Guid> companyIds);
        Task<object> BulkDeleteCompaniesAsync(List<Guid> companyIds);
        Task UpdateCompanyStatusAsync(Guid companyId, int status, Guid reviewerId);

        // Companies & Stats (Get partial)
        Task<AdminCompaniesListResponseDto> GetCompaniesAsync(
            string? q,
            List<string>? statuses,
            string? sortBy,
            string? sortDirection,
            int page,
            int pageSize
        );
        Task<AdminCompanySummaryDto> GetCompanyStatsAsync();
        Task<object> GetCompanyProfileAsync(Guid companyId);
        Task<object> GetCompanyBusesAsync(Guid companyId);
        Task<object> GetCompanyRoutesAsync(Guid companyId);
        Task<object> GetCompanyAnalyticsAsync(Guid companyId, int? year, int? month);
        Task<object> GetBookedTicketsAsync(Guid companyId, TicketStatus? status, int page, int pageSize);
        Task<object> GetTripsAsync(Guid companyId, int? year, int? month, int page, int pageSize);
        Task<object> GetSeatLayoutsAsync(Guid busTypeId);
        Task<object> GetBusTypeAmenitiesAsync(Guid busTypeId);
        Task<object> GetUserDetailsAsync(Guid userId);
        Task<object> GetUserTicketsAsync(Guid userId);
        Task<object> GetMonthlyTicketStatsAsync(int year, int month);

        // Overview (Overview partial)
        Task<AdminDashboardOverviewDto> GetDashboardOverviewAsync();

        // Create & Delete (CreateDelete partial)
        Task<Guid> CreateBusAsync(Guid companyId, CreateBusDto dto);
        Task DeleteBusAsync(Guid id);
        Task<Guid> CreateTripAsync(Guid companyId, CreateTripDto dto);
        Task DeleteTripAsync(Guid tripId);
        Task<Guid> CreateSeatLayoutAsync(Guid busTypeId, CreateSeatLayoutDto dto);
        Task DeleteSeatLayoutAsync(Guid layoutId);

        // Update (Update partial)
        Task UpdateBusAsync(Guid id, UpdateBusDto dto);
        Task UpdateCompanyProfileAsync(Guid companyId, UpdateCompanyProfileDto dto);
        Task UpdateTripAsync(Guid tripId, UpdateTripDto dto);
        Task UpdateBusTypeAmenitiesAsync(Guid busTypeId, UpdateBusTypeAmenitiesDto dto);
        Task UpdateSeatLayoutAsync(Guid layoutId, UpdateSeatLayoutDto dto);

        // Users (Users partial)
        Task<AdminUsersListResponseDto> GetUsersAsync(
            string? q,
            List<string>? roles,
            List<string>? statuses,
            string? role,
            bool? isActive,
            string? sortBy,
            string? sortDirection,
            int page,
            int pageSize
        );
        Task<AdminUserListItemDto> CreateUserAsync(AdminCreateUserDto dto);
        Task<AdminUserListItemDto> UpdateUserAsync(Guid userId, AdminUpdateUserDto dto, Guid currentUserId);
        Task DeleteUserAsync(Guid userId, Guid currentUserId);
    }
}
