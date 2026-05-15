using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class AddTripPoliciesFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationPolicy",
                table: "Trips",
                type: "text",
                nullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Trips",
                type: "text",
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CancellationPolicy", table: "Trips");

            migrationBuilder.DropColumn(name: "Notes", table: "Trips");
        }
    }
}
