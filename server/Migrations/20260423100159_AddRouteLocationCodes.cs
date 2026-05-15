using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteLocationCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "arrival_district_code",
                table: "BusRoutes",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "arrival_province_code",
                table: "BusRoutes",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "arrival_ward_code",
                table: "BusRoutes",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "departure_district_code",
                table: "BusRoutes",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "departure_province_code",
                table: "BusRoutes",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "departure_ward_code",
                table: "BusRoutes",
                type: "text",
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "arrival_district_code", table: "BusRoutes");

            migrationBuilder.DropColumn(name: "arrival_province_code", table: "BusRoutes");

            migrationBuilder.DropColumn(name: "arrival_ward_code", table: "BusRoutes");

            migrationBuilder.DropColumn(name: "departure_district_code", table: "BusRoutes");

            migrationBuilder.DropColumn(name: "departure_province_code", table: "BusRoutes");

            migrationBuilder.DropColumn(name: "departure_ward_code", table: "BusRoutes");
        }
    }
}
