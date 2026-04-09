using Microsoft.EntityFrameworkCore;
using Pbl3.Enums;
using Pbl3.Models;

namespace Pbl3.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<BusCompany> BusCompanies { get; set; }
        public DbSet<BusCompanyAdmin> BusCompanyAdmins { get; set; }
        public DbSet<BusAdminUpgradeRequest> BusAdminUpgradeRequests { get; set; }
        public DbSet<BusType> BusTypes { get; set; }
        public DbSet<SeatLayout> SeatLayouts { get; set; }
        public DbSet<Bus> Buses { get; set; }
        public DbSet<BusImage> BusImages { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<BusRoute> BusRoutes { get; set; }
        public DbSet<BusRouteStop> RouteStops { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Passenger> Passengers { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<SeatHold> SeatHolds { get; set; }
        public DbSet<PaymentIntent> PaymentIntents { get; set; }
        public DbSet<Refund> Refunds { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AdministrativeRegion> AdministrativeRegions { get; set; }
        public DbSet<AdministrativeUnit> AdministrativeUnits { get; set; }
        public DbSet<Province> Provinces { get; set; }
        public DbSet<District> Districts { get; set; }
        public DbSet<Ward> Wards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            // Register Enums
            modelBuilder.HasPostgresEnum<UserRole>();
            modelBuilder.HasPostgresEnum<BusAdminUpgradeRequestStatus>();
            modelBuilder.HasPostgresEnum<TripStatus>();
            modelBuilder.HasPostgresEnum<SeatType>();
            modelBuilder.HasPostgresEnum<StationType>();
            modelBuilder.HasPostgresEnum<BookingStatus>();
            modelBuilder.HasPostgresEnum<TicketStatus>();
            modelBuilder.HasPostgresEnum<SeatHoldStatus>();
            modelBuilder.HasPostgresEnum<PaymentProvider>();
            modelBuilder.HasPostgresEnum<PaymentIntentStatus>();
            modelBuilder.HasPostgresEnum<RefundStatus>();
            modelBuilder.HasPostgresEnum<NotificationType>();
            modelBuilder.HasPostgresEnum<NotificationStatus>();

            // BusCompanyAdmin Key
            modelBuilder.Entity<BusCompanyAdmin>().HasKey(bca => bca.UserID);

            modelBuilder
                .Entity<BusCompanyAdmin>()
                .HasOne(bca => bca.User)
                .WithMany(u => u.BusCompanyAdmins)
                .HasForeignKey(bca => bca.UserID);

            modelBuilder.Entity<BusAdminUpgradeRequest>().HasKey(r => r.RequestID);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .HasOne(r => r.RequesterUser)
                .WithMany(u => u.BusAdminUpgradeRequests)
                .HasForeignKey(r => r.RequesterUserID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .HasOne(r => r.ReviewedByUser)
                .WithMany(u => u.ReviewedBusAdminUpgradeRequests)
                .HasForeignKey(r => r.ReviewedByUserID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .HasOne(r => r.BusCompany)
                .WithMany(c => c.BusAdminUpgradeRequests)
                .HasForeignKey(r => r.CompanyID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .Property(r => r.CompanyName)
                .IsRequired()
                .HasMaxLength(200);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .Property(r => r.LicenseNumber)
                .HasMaxLength(100);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .Property(r => r.Hotline)
                .HasMaxLength(20);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .Property(r => r.Reason)
                .HasMaxLength(1000);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .Property(r => r.ReviewNote)
                .HasMaxLength(1000);

            modelBuilder
                .Entity<BusAdminUpgradeRequest>()
                .HasIndex(r => new { r.RequesterUserID, r.Status, r.RequestedAt });

            modelBuilder
                .Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Notification>()
                .HasOne(n => n.Booking)
                .WithMany(b => b.Notifications)
                .HasForeignKey(n => n.BookingID)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<Notification>()
                .HasOne(n => n.Request)
                .WithMany(r => r.Notifications)
                .HasForeignKey(n => n.RequestID)
                .OnDelete(DeleteBehavior.SetNull);

            // RouteStop Relations
            modelBuilder
                .Entity<BusRouteStop>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.BusRouteStops)
                .HasForeignKey(rs => rs.RouteID);

            modelBuilder
                .Entity<BusRouteStop>()
                .HasOne(rs => rs.Station)
                .WithMany(s => s.BusRouteStops)
                .HasForeignKey(rs => rs.StationID);

            // Ticket Relations
            modelBuilder
                .Entity<Ticket>()
                .HasOne(t => t.Booking)
                .WithMany(b => b.Tickets)
                .HasForeignKey(t => t.BookingID)
                .OnDelete(DeleteBehavior.Cascade); // Deleting booking deletes tickets

            modelBuilder
                .Entity<Ticket>()
                .HasOne(t => t.Trip)
                .WithMany(tr => tr.Tickets)
                .HasForeignKey(t => t.TripID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Ticket>()
                .HasOne(t => t.Passenger)
                .WithMany(p => p.Tickets)
                .HasForeignKey(t => t.PassengerID)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking Relations
            modelBuilder
                .Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserID)
                .OnDelete(DeleteBehavior.SetNull);

            // SeatHold
            modelBuilder
                .Entity<SeatHold>()
                .HasOne(sh => sh.Trip)
                .WithMany(t => t.SeatHolds)
                .HasForeignKey(sh => sh.TripID);

            modelBuilder
                .Entity<SeatHold>()
                .HasOne(sh => sh.SeatLayout)
                .WithMany()
                .HasForeignKey(sh => sh.SeatLayoutID);

            // Review
            modelBuilder
                .Entity<Review>()
                .HasOne(r => r.Booking)
                .WithMany(b => b.Reviews)
                .HasForeignKey(r => r.BookingID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Review>()
                .HasOne(r => r.Trip)
                .WithMany(t => t.Reviews)
                .HasForeignKey(r => r.TripID)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder
                .Entity<BusRoute>()
                .HasOne(r => r.BusCompany)
                .WithMany(c => c.Routes)
                .HasForeignKey(r => r.CompanyID);

            // Refund Relations
            modelBuilder
                .Entity<Refund>()
                .HasOne(r => r.PaymentIntent)
                .WithMany(pi => pi.Refunds)
                .HasForeignKey(r => r.IntentID);

            modelBuilder
                .Entity<Province>()
                .HasOne(p => p.AdministrativeRegion)
                .WithMany(ar => ar.Provinces)
                .HasForeignKey(p => p.AdministrativeRegionID);

            modelBuilder
                .Entity<Province>()
                .HasOne(p => p.AdministrativeUnit)
                .WithMany(au => au.Provinces)
                .HasForeignKey(p => p.AdministrativeUnitID);

            modelBuilder
                .Entity<District>()
                .HasOne(d => d.Province)
                .WithMany(p => p.Districts)
                .HasForeignKey(d => d.ProvinceCode)
                .HasPrincipalKey(p => p.Code);

            modelBuilder
                .Entity<District>()
                .HasOne(d => d.AdministrativeUnit)
                .WithMany(au => au.Districts)
                .HasForeignKey(d => d.AdministrativeUnitID);

            modelBuilder
                .Entity<Ward>()
                .HasOne(w => w.District)
                .WithMany(d => d.Wards)
                .HasForeignKey(w => w.DistrictCode)
                .HasPrincipalKey(d => d.Code);

            modelBuilder
                .Entity<Ward>()
                .HasOne(w => w.AdministrativeUnit)
                .WithMany(au => au.Wards)
                .HasForeignKey(w => w.AdministrativeUnitID);

            modelBuilder
                .Entity<Station>()
                .HasOne(s => s.Province)
                .WithMany(p => p.Stations)
                .HasForeignKey(s => s.ProvinceCode)
                .HasPrincipalKey(p => p.Code)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<Station>()
                .HasOne(s => s.District)
                .WithMany(d => d.Stations)
                .HasForeignKey(s => s.DistrictCode)
                .HasPrincipalKey(d => d.Code)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<Station>()
                .HasOne(s => s.Ward)
                .WithMany(w => w.Stations)
                .HasForeignKey(s => s.WardCode)
                .HasPrincipalKey(w => w.Code)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
