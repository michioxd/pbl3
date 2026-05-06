using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyProfileUpdateRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .Annotation("Npgsql:Enum:bus_admin_upgrade_request_status", "pending,approved,rejected")
                .Annotation("Npgsql:Enum:company_profile_update_request_status", "pending,approved,rejected")
                .Annotation("Npgsql:Enum:notification_status", "sent,failed")
                .Annotation("Npgsql:Enum:notification_type", "email,sms,push")
                .Annotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .Annotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .Annotation("Npgsql:Enum:refund_status", "pending,processed,approved,processing,completed,rejected,failed")
                .Annotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .Annotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .Annotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .Annotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .Annotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .Annotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin")
                .OldAnnotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .OldAnnotation("Npgsql:Enum:bus_admin_upgrade_request_status", "pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:notification_status", "sent,failed")
                .OldAnnotation("Npgsql:Enum:notification_type", "email,sms,push")
                .OldAnnotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .OldAnnotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .OldAnnotation("Npgsql:Enum:refund_status", "pending,processed,approved,processing,completed,rejected,failed")
                .OldAnnotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .OldAnnotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .OldAnnotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .OldAnnotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");

            migrationBuilder.CreateTable(
                name: "CompanyProfileUpdateRequests",
                columns: table => new
                {
                    RequestID = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyID = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterUserID = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewedByUserID = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LicenseNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Hotline = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyProfileUpdateRequests", x => x.RequestID);
                    table.ForeignKey(
                        name: "FK_CompanyProfileUpdateRequests_BusCompanies_CompanyID",
                        column: x => x.CompanyID,
                        principalTable: "BusCompanies",
                        principalColumn: "CompanyID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyProfileUpdateRequests_Users_RequesterUserID",
                        column: x => x.RequesterUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CompanyProfileUpdateRequests_Users_ReviewedByUserID",
                        column: x => x.ReviewedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyProfileUpdateRequests_CompanyID_Status_RequestedAt",
                table: "CompanyProfileUpdateRequests",
                columns: new[] { "CompanyID", "Status", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyProfileUpdateRequests_RequesterUserID",
                table: "CompanyProfileUpdateRequests",
                column: "RequesterUserID");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyProfileUpdateRequests_ReviewedByUserID",
                table: "CompanyProfileUpdateRequests",
                column: "ReviewedByUserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyProfileUpdateRequests");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .Annotation("Npgsql:Enum:bus_admin_upgrade_request_status", "pending,approved,rejected")
                .Annotation("Npgsql:Enum:notification_status", "sent,failed")
                .Annotation("Npgsql:Enum:notification_type", "email,sms,push")
                .Annotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .Annotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .Annotation("Npgsql:Enum:refund_status", "pending,processed,approved,processing,completed,rejected,failed")
                .Annotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .Annotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .Annotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .Annotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .Annotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .Annotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin")
                .OldAnnotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .OldAnnotation("Npgsql:Enum:bus_admin_upgrade_request_status", "pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:company_profile_update_request_status", "pending,approved,rejected")
                .OldAnnotation("Npgsql:Enum:notification_status", "sent,failed")
                .OldAnnotation("Npgsql:Enum:notification_type", "email,sms,push")
                .OldAnnotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .OldAnnotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .OldAnnotation("Npgsql:Enum:refund_status", "pending,processed,approved,processing,completed,rejected,failed")
                .OldAnnotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .OldAnnotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .OldAnnotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .OldAnnotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");
        }
    }
}
