using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddMomoPaymentMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ProcessedAt",
                table: "Refunds",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderMessage",
                table: "Refunds",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderRequestId",
                table: "Refunds",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProviderResultCode",
                table: "Refunds",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ProviderTransactionId",
                table: "Refunds",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Deeplink",
                table: "PaymentIntents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "PaymentIntents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayUrl",
                table: "PaymentIntents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderMessage",
                table: "PaymentIntents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderOrderId",
                table: "PaymentIntents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderRequestId",
                table: "PaymentIntents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProviderResultCode",
                table: "PaymentIntents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ProviderTransactionId",
                table: "PaymentIntents",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QrCodeUrl",
                table: "PaymentIntents",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProcessedAt",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "ProviderMessage",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "ProviderRequestId",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "ProviderResultCode",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "ProviderTransactionId",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "Deeplink",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "PayUrl",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "ProviderMessage",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "ProviderOrderId",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "ProviderRequestId",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "ProviderResultCode",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "ProviderTransactionId",
                table: "PaymentIntents");

            migrationBuilder.DropColumn(
                name: "QrCodeUrl",
                table: "PaymentIntents");
        }
    }
}
