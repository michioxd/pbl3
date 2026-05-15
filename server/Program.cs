using System.IdentityModel.Tokens.Jwt;
using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;
using Pbl3.Configurations;
using Pbl3.Data;
using Pbl3.Enums;
using Pbl3.Extensions;
using Pbl3.Models;
using Pbl3.Services;

namespace Pbl3
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            Env.Load();

            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddControllers();
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddScoped<ITripSearchService, TripSearchService>();
            builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();
            builder.Services.AddScoped<IBusAdminOwnershipService, BusAdminOwnershipService>();
            builder.Services.AddScoped<IBookingService, BookingService>();
            builder.Services.AddScoped<IPaymentService, PaymentService>();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(
                    "FrontendDev",
                    policy =>
                        policy
                            .WithOrigins("http://localhost:5173")
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                );
            });

            builder
                .Services.AddOptions<MomoOptions>()
                .Configure(options =>
                {
                    options.PartnerCode =
                        Environment.GetEnvironmentVariable("MOMO_PARTNER_CODE") ?? string.Empty;
                    options.AccessKey =
                        Environment.GetEnvironmentVariable("MOMO_ACCESS_KEY") ?? string.Empty;
                    options.SecretKey =
                        Environment.GetEnvironmentVariable("MOMO_SECRET_KEY") ?? string.Empty;
                    options.Endpoint =
                        Environment.GetEnvironmentVariable("MOMO_ENDPOINT") ?? string.Empty;
                    options.RedirectUrl =
                        Environment.GetEnvironmentVariable("MOMO_REDIRECT_URL") ?? string.Empty;
                    options.IpnUrl =
                        Environment.GetEnvironmentVariable("MOMO_IPN_URL") ?? string.Empty;
                    options.PartnerName =
                        Environment.GetEnvironmentVariable("MOMO_PARTNER_NAME") ?? string.Empty;
                    options.StoreId =
                        Environment.GetEnvironmentVariable("MOMO_STORE_ID") ?? string.Empty;
                    options.RequestType =
                        Environment.GetEnvironmentVariable("MOMO_REQUEST_TYPE") ?? "captureWallet";
                    options.Lang = Environment.GetEnvironmentVariable("MOMO_LANG") ?? "vi";
                });
            builder.Services.AddHttpClient<IPaymentService, PaymentService>(
                (serviceProvider, client) =>
                {
                    var options = serviceProvider.GetRequiredService<IOptions<MomoOptions>>().Value;
                    if (!string.IsNullOrWhiteSpace(options.Endpoint))
                    {
                        client.BaseAddress = new Uri(options.Endpoint.TrimEnd('/'));
                    }
                }
            );

            var connectionString =
                Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? builder.Configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrEmpty(connectionString))
                throw new InvalidOperationException("Connection string not found.");

            var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
            dataSourceBuilder.MapEnum<UserRole>();
            dataSourceBuilder.MapEnum<CompanyStatus>();
            dataSourceBuilder.MapEnum<TripStatus>();
            dataSourceBuilder.MapEnum<SeatType>();
            dataSourceBuilder.MapEnum<StationType>();
            dataSourceBuilder.MapEnum<BookingStatus>();
            dataSourceBuilder.MapEnum<TicketStatus>();
            dataSourceBuilder.MapEnum<SeatHoldStatus>();
            dataSourceBuilder.MapEnum<PaymentProvider>();
            dataSourceBuilder.MapEnum<PaymentIntentStatus>();
            dataSourceBuilder.MapEnum<RefundStatus>();
            dataSourceBuilder.MapEnum<NotificationType>();
            dataSourceBuilder.MapEnum<NotificationStatus>();
            var dataSource = dataSourceBuilder.Build();

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(dataSource)
            );

            builder.Services.AddScoped<DbInitializer>();
            builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
            builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

            var jwtKey =
                Environment.GetEnvironmentVariable("JWT_KEY") ?? builder.Configuration["Jwt:Key"];
            var jwtIssuer =
                Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? builder.Configuration["Jwt:Issuer"];
            var jwtAudience =
                Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                ?? builder.Configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(jwtKey))
                throw new InvalidOperationException("JWT key not found.");
            if (string.IsNullOrWhiteSpace(jwtIssuer))
                throw new InvalidOperationException("JWT issuer not found.");
            if (string.IsNullOrWhiteSpace(jwtAudience))
                throw new InvalidOperationException("JWT audience not found.");

            builder
                .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.RequireHttpsMetadata = false;
                    options.MapInboundClaims = false;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtIssuer,

                        ValidateAudience = true,
                        ValidAudience = jwtAudience,

                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,

                        NameClaimType = JwtRegisteredClaimNames.Sub,
                        RoleClaimType = "role",
                    };
                });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy(
                    "UserOnly",
                    policy =>
                        policy.RequireRole(
                            UserRole.Passenger.ToString(),
                            UserRole.BusAdmin.ToString(),
                            UserRole.SysAdmin.ToString()
                        )
                );
                options.AddPolicy(
                    "BusAdmin",
                    policy =>
                        policy.RequireRole(
                            UserRole.BusAdmin.ToString(),
                            UserRole.SysAdmin.ToString()
                        )
                );
                options.AddPolicy(
                    "AdminOnly",
                    policy => policy.RequireRole(UserRole.SysAdmin.ToString())
                );
            });

            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "PBL3", Version = "v1" });

                options.AddSecurityDefinition(
                    "Bearer",
                    new OpenApiSecurityScheme
                    {
                        Name = "Authorization",
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        In = ParameterLocation.Header,
                        Description = "Nhập JWT token thuần, Swagger sẽ tự thêm tiền tố Bearer.",
                    }
                );

                options.AddSecurityRequirement(document =>
                    new()
                    {
                        {
                            new OpenApiSecuritySchemeReference("Bearer", document, null),
                            new List<string>()
                        },
                    }
                );
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("FrontendDev");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            if (args.Contains("--migrate"))
            {
                await app.MigrateDatabaseAsync();
                return;
            }

            await app.InitializeDatabaseAsync();

            if (args.Contains("--seed"))
            {
                await app.SeedDatabaseAsync();
                return;
            }

            app.Run();
        }
    }
}
