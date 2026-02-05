using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pbl3.Data;
using Pbl3.Extensions;
using Pbl3.Enums;
using DotNetEnv;

namespace Pbl3
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            Env.Load();

            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
                                   ?? builder.Configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Connection string not found.");
            }

            var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
            dataSourceBuilder.MapEnum<UserRole>();
            dataSourceBuilder.MapEnum<TripStatus>();
            dataSourceBuilder.MapEnum<SeatType>();
            dataSourceBuilder.MapEnum<StationType>();
            dataSourceBuilder.MapEnum<CalendarExceptionType>();
            dataSourceBuilder.MapEnum<BookingStatus>();
            dataSourceBuilder.MapEnum<TicketStatus>();
            dataSourceBuilder.MapEnum<SeatHoldStatus>();
            dataSourceBuilder.MapEnum<PaymentProvider>();
            dataSourceBuilder.MapEnum<PaymentIntentStatus>();
            dataSourceBuilder.MapEnum<PaymentChargeStatus>();
            dataSourceBuilder.MapEnum<RefundStatus>();
            dataSourceBuilder.MapEnum<NotificationType>();
            dataSourceBuilder.MapEnum<NotificationStatus>();
            var dataSource = dataSourceBuilder.Build();

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(dataSource));

            builder.Services.AddScoped<DbInitializer>();
            builder.Services.AddControllers();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.MapControllers();

            await app.InitializeDatabaseAsync();

            app.Run();
        }
    }
}