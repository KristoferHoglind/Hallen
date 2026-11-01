using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class EnforceSingleGroupOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Preserve the earliest owner if older versions allowed multiple owners.
            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT "Id", ROW_NUMBER() OVER (
                        PARTITION BY "SportsGroupId" ORDER BY "CreatedAt", "Id") AS position
                    FROM "SportsGroupMembers" WHERE "Role" = 'Owner' AND "Status" = 'Approved'
                )
                UPDATE "SportsGroupMembers" AS member SET "Role" = 'Admin'
                FROM ranked WHERE member."Id" = ranked."Id" AND ranked.position > 1;
                UPDATE "GroupInvitations" SET "RevokedAt" = COALESCE("RevokedAt", now())
                WHERE "Role" = 'Owner' AND "UsedAt" IS NULL;
                """);
            migrationBuilder.CreateIndex(
                name: "IX_SportsGroupMembers_SportsGroupId",
                table: "SportsGroupMembers",
                column: "SportsGroupId",
                unique: true,
                filter: "\"Role\" = 'Owner' AND \"Status\" = 'Approved'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SportsGroupMembers_SportsGroupId",
                table: "SportsGroupMembers");
        }
    }
}
