using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class FixNotificationBookingRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Bookings_BookingID1",
                table: "Notifications"
            );

            migrationBuilder.DropIndex(name: "IX_Notifications_BookingID1", table: "Notifications");

            migrationBuilder.DropColumn(name: "BookingID1", table: "Notifications");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BookingID1",
                table: "Notifications",
                type: "uuid",
                nullable: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_BookingID1",
                table: "Notifications",
                column: "BookingID1"
            );

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Bookings_BookingID1",
                table: "Notifications",
                column: "BookingID1",
                principalTable: "Bookings",
                principalColumn: "BookingID"
            );
        }
    }
}
