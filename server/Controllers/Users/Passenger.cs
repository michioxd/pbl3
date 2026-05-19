using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Pbl3.Data;

namespace Pbl3.Controllers.Users
{
    [ApiController]
    [Route("api/passenger")]
    [Authorize(Policy = "UserOnly")]
    [Tags("Passenger")]
    public partial class PassengersController : ControllerBase
    {
        private readonly IPassengerService _passengerService;
        private readonly ICurrentUserContext _currentUserContext;

        public PassengersController(
            IPassengerService passengerService,
            ICurrentUserContext currentUserContext
        )
        {
            _passengerService = passengerService;
            _currentUserContext = currentUserContext;
        }
    }
}
