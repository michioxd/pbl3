using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Models;

namespace Pbl3.Services.Admin
{
    public partial class SystemAdminManagementService(
        ApplicationDbContext context,
        IPasswordHasher<User> passwordHasher
    ) : ISystemAdminManagementService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IPasswordHasher<User> _passwordHasher = passwordHasher;

        private Task<bool> IsRouteOwnedByCompanyAsync(Guid companyId, Guid routeId)
        {
            return _context.BusRoutes.AnyAsync(r =>
                r.RouteID == routeId && r.CompanyID == companyId
            );
        }

        private Task<bool> IsBusOwnedByCompanyAsync(Guid companyId, Guid busId)
        {
            return _context.Buses.AnyAsync(b => b.BusID == busId && b.CompanyID == companyId);
        }

        private Task<bool> IsBusTypeExistsAsync(Guid busTypeId)
        {
            return _context.BusTypes.AnyAsync(bt => bt.BusTypeID == busTypeId);
        }
    }
}
