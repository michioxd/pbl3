using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class SyncPendingModelChanges : Migration
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
                .Annotation("Npgsql:Enum:review_status", "pending,approved,rejected,flagged")
                .Annotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .Annotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .Annotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .Annotation("Npgsql:Enum:ticket_status", "pending_payment,issued,checked_in,cancelled")
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
                .OldAnnotation("Npgsql:Enum:ticket_status", "pending_payment,issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
                .Annotation("Npgsql:Enum:ticket_status", "pending_payment,issued,checked_in,cancelled")
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
                .OldAnnotation("Npgsql:Enum:review_status", "pending,approved,rejected,flagged")
                .OldAnnotation("Npgsql:Enum:seat_hold_status", "held,confirmed,expired")
                .OldAnnotation("Npgsql:Enum:seat_type", "window,aisle,middle,driver,upper_deck,lower_deck")
                .OldAnnotation("Npgsql:Enum:station_type", "bus_station,office,pick_up_point")
                .OldAnnotation("Npgsql:Enum:ticket_status", "pending_payment,issued,checked_in,cancelled")
                .OldAnnotation("Npgsql:Enum:trip_status", "scheduled,running,completed,cancelled")
                .OldAnnotation("Npgsql:Enum:user_role", "passenger,bus_admin,sys_admin");
        }
    }
}
