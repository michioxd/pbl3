using Microsoft.EntityFrameworkCore;
using Pbl3.Models;
using Pbl3.Enums;

namespace Pbl3.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Passenger> Passengers { get; set; }
        public DbSet<BusCompanyAdmin> BusCompanyAdmins { get; set; }
        public DbSet<BusCompany> BusCompanies { get; set; }
        public DbSet<Bus> Buses { get; set; }
        public DbSet<Utility> Utilities { get; set; }
        public DbSet<BusUtility> BusUtilities { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<TripSeat> TripSeats { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketDetail> TicketDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasPostgresEnum<UserRole>();
            modelBuilder.HasPostgresEnum<TripStatus>();
            modelBuilder.HasPostgresEnum<SeatStatus>();
            modelBuilder.HasPostgresEnum<TicketStatus>();

            modelBuilder.Entity<Passenger>()
                .HasOne(p => p.User)
                .WithOne(u => u.PassengerProfile)
                .HasForeignKey<Passenger>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BusCompanyAdmin>()
                .HasOne(a => a.User)
                .WithOne(u => u.AdminProfile)
                .HasForeignKey<BusCompanyAdmin>(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BusUtility>()
                .HasKey(bu => new { bu.BusId, bu.UtilityId });

            modelBuilder.Entity<BusUtility>()
                .HasOne(bu => bu.Bus)
                .WithMany(b => b.BusUtilities)
                .HasForeignKey(bu => bu.BusId);

            modelBuilder.Entity<BusUtility>()
                .HasOne(bu => bu.Utility)
                .WithMany(u => u.BusUtilities)
                .HasForeignKey(bu => bu.UtilityId);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.StartLocation)
                .WithMany(l => l.TripsStartingHere)
                .HasForeignKey(t => t.StartLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Trip>()
                .HasOne(t => t.EndLocation)
                .WithMany(l => l.TripsEndingHere)
                .HasForeignKey(t => t.EndLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TripSeat>()
                .Property(s => s.Version)
                .IsRowVersion();
        }
    }
}