using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundRequestModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                .OldAnnotation("Npgsql:Enum:notification_status", "sent,failed")
                .OldAnnotation("Npgsql:Enum:notification_type", "email,sms,push")
                .OldAnnotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .OldAnnotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .OldAnnotation("Npgsql:Enum:refund_status", "pending,processed")
                .OldAnnotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .OldAnnotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .OldAnnotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .OldAnnotation("Npgsql:Enum:ticket_status", "issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");

            migrationBuilder.CreateTable(
                name: "RefundRequests",
                columns: table => new
                {
                    RefundRequestID = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingID = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentIntentID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<Guid>(type: "uuid", nullable: true),
                    RequestedAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessedByUserID = table.Column<Guid>(type: "uuid", nullable: true),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    RefundID = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundRequests", x => x.RefundRequestID);
                    table.ForeignKey(
                        name: "FK_RefundRequests_Bookings_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefundRequests_PaymentIntents_PaymentIntentID",
                        column: x => x.PaymentIntentID,
                        principalTable: "PaymentIntents",
                        principalColumn: "IntentID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefundRequests_Refunds_RefundID",
                        column: x => x.RefundID,
                        principalTable: "Refunds",
                        principalColumn: "RefundID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RefundRequests_Users_ProcessedByUserID",
                        column: x => x.ProcessedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RefundRequests_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_BookingID",
                table: "RefundRequests",
                column: "BookingID");

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_PaymentIntentID",
                table: "RefundRequests",
                column: "PaymentIntentID");

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_ProcessedByUserID",
                table: "RefundRequests",
                column: "ProcessedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_RefundID",
                table: "RefundRequests",
                column: "RefundID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefundRequests_UserID",
                table: "RefundRequests",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefundRequests");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,paid,cancelled,refunded")
                .Annotation("Npgsql:Enum:bus_admin_upgrade_request_status", "pending,approved,rejected")
                .Annotation("Npgsql:Enum:notification_status", "sent,failed")
                .Annotation("Npgsql:Enum:notification_type", "email,sms,push")
                .Annotation("Npgsql:Enum:payment_intent_status", "created,succeeded,failed")
                .Annotation("Npgsql:Enum:payment_provider", "momo,stripe,cash")
                .Annotation("Npgsql:Enum:refund_status", "pending,processed")
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
        }
    }
}
