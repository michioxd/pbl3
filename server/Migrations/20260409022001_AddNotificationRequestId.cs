using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationRequestId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Bookings_BookingID",
                table: "Notifications");

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingID",
                table: "Notifications",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "BookingID1",
                table: "Notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RequestID",
                table: "Notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_BookingID1",
                table: "Notifications",
                column: "BookingID1");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RequestID",
                table: "Notifications",
                column: "RequestID");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Bookings_BookingID",
                table: "Notifications",
                column: "BookingID",
                principalTable: "Bookings",
                principalColumn: "BookingID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Bookings_BookingID1",
                table: "Notifications",
                column: "BookingID1",
                principalTable: "Bookings",
                principalColumn: "BookingID");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_BusAdminUpgradeRequests_RequestID",
                table: "Notifications",
                column: "RequestID",
                principalTable: "BusAdminUpgradeRequests",
                principalColumn: "RequestID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Bookings_BookingID",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Bookings_BookingID1",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_BusAdminUpgradeRequests_RequestID",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_BookingID1",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_RequestID",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "BookingID1",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RequestID",
                table: "Notifications");

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingID",
                table: "Notifications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Bookings_BookingID",
                table: "Notifications",
                column: "BookingID",
                principalTable: "Bookings",
                principalColumn: "BookingID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
