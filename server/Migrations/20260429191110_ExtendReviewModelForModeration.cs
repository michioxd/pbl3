using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pbl3_server.Migrations
{
    /// <inheritdoc />
    public partial class ExtendReviewModelForModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Reviews",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsFlagged",
                table: "Reviews",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Reviews",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedByUserID",
                table: "Reviews",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationReason",
                table: "Reviews",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Reviews",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "UserID",
                table: "Reviews",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ModeratedByUserID",
                table: "Reviews",
                column: "ModeratedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_Status",
                table: "Reviews",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserID",
                table: "Reviews",
                column: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_ModeratedByUserID",
                table: "Reviews",
                column: "ModeratedByUserID",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_UserID",
                table: "Reviews",
                column: "UserID",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_ModeratedByUserID",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_UserID",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ModeratedByUserID",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_Status",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_UserID",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ModeratedByUserID",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ModerationReason",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Reviews");
        }
    }
}
