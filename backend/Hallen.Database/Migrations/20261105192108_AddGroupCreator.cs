using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupCreator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "sports_groups",
                type: "uuid",
                nullable: true);

            // Historic creators were not recorded; use the current owner as baseline.
            migrationBuilder.Sql("""
                UPDATE sports_groups AS g
                SET "CreatedByUserId" = m."AppUserId"
                FROM "SportsGroupMembers" AS m
                WHERE m."SportsGroupId" = g.id AND m."Role" = 'Owner';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "sports_groups");
        }
    }
}
