using System;
using Pbl3.Data;

namespace Pbl3.Services.Users
{
    public partial class PassengersService(ApplicationDbContext context) : IPassengersService
    {
        private readonly ApplicationDbContext _context = context;
    }
}
