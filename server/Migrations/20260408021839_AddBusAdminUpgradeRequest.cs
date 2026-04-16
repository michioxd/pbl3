using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddBusAdminUpgradeRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder
                .AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .Annotation(
                    "Npgsql:Enum:bus_admin_upgrade_request_status",
                    "pending,approved,rejected"
                )
                .Annotation("Npgsql:Enum:notification_status", "sent,failed")
                .Annotation("Npgsql:Enum:notification_type", "email,sms,push")
                .Annotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .Annotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .Annotation("Npgsql:Enum:refund_status", "pending,processed")
                .Annotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .Annotation(
                    "Npgsql:Enum:seat_type",
                    "window,aisle,middle,driver,upper_deck,lower_deck"
                )
                .Annotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .Annotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .Annotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .Annotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin")
                .OldAnnotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .OldAnnotation("Npgsql:Enum:notification_status", "sent,failed")
                .OldAnnotation("Npgsql:Enum:notification_type", "email,sms,push")
                .OldAnnotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .OldAnnotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .OldAnnotation("Npgsql:Enum:refund_status", "pending,processed")
                .OldAnnotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .OldAnnotation(
                    "Npgsql:Enum:seat_type",
                    "window,aisle,middle,driver,upper_deck,lower_deck"
                )
                .OldAnnotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .OldAnnotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");

            migrationBuilder.CreateTable(
                name: "BusAdminUpgradeRequests",
                columns: table => new
                {
                    RequestID = table.Column<Guid>(type: "uuid", nullable: false),
                    RequesterUserID = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewedByUserID = table.Column<Guid>(type: "uuid", nullable: true),
                    CompanyID = table.Column<Guid>(type: "uuid", nullable: true),
                    CompanyName = table.Column<string>(
                        type: "character varying(200)",
                        maxLength: 200,
                        nullable: false
                    ),
                    LicenseNumber = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: true
                    ),
                    Hotline = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: true
                    ),
                    Reason = table.Column<string>(
                        type: "character varying(1000)",
                        maxLength: 1000,
                        nullable: true
                    ),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    ReviewedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    ReviewNote = table.Column<string>(
                        type: "character varying(1000)",
                        maxLength: 1000,
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusAdminUpgradeRequests", x => x.RequestID);
                    table.ForeignKey(
                        name: "FK_BusAdminUpgradeRequests_BusCompanies_CompanyID",
                        column: x => x.CompanyID,
                        principalTable: "BusCompanies",
                        principalColumn: "CompanyID",
                        onDelete: ReferentialAction.SetNull
                    );
                    table.ForeignKey(
                        name: "FK_BusAdminUpgradeRequests_Users_RequesterUserID",
                        column: x => x.RequesterUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict
                    );
                    table.ForeignKey(
                        name: "FK_BusAdminUpgradeRequests_Users_ReviewedByUserID",
                        column: x => x.ReviewedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusAdminUpgradeRequests_CompanyID",
                table: "BusAdminUpgradeRequests",
                column: "CompanyID"
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusAdminUpgradeRequests_RequesterUserID_Status_RequestedAt",
                table: "BusAdminUpgradeRequests",
                columns: new[] { "RequesterUserID", "Status", "RequestedAt" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_BusAdminUpgradeRequests_ReviewedByUserID",
                table: "BusAdminUpgradeRequests",
                column: "ReviewedByUserID"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "BusAdminUpgradeRequests");

            migrationBuilder
                .AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .Annotation("Npgsql:Enum:notification_status", "sent,failed")
                .Annotation("Npgsql:Enum:notification_type", "email,sms,push")
                .Annotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .Annotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .Annotation("Npgsql:Enum:refund_status", "pending,processed")
                .Annotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .Annotation(
                    "Npgsql:Enum:seat_type",
                    "window,aisle,middle,driver,upper_deck,lower_deck"
                )
                .Annotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .Annotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .Annotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .Annotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin")
                .OldAnnotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .OldAnnotation(
                    "Npgsql:Enum:bus_admin_upgrade_request_status",
                    "pending,approved,rejected"
                )
                .OldAnnotation("Npgsql:Enum:notification_status", "sent,failed")
                .OldAnnotation("Npgsql:Enum:notification_type", "email,sms,push")
                .OldAnnotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .OldAnnotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .OldAnnotation("Npgsql:Enum:refund_status", "pending,processed")
                .OldAnnotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .OldAnnotation(
                    "Npgsql:Enum:seat_type",
                    "window,aisle,middle,driver,upper_deck,lower_deck"
                )
                .OldAnnotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .OldAnnotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");
        }
    }
}
