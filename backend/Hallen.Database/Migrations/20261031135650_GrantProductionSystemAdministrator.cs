using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class GrantProductionSystemAdministrator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // One-time provisioning of the existing operator account. Never create an account
            // or reactivate a disabled one, and do not regrant privileges on subsequent starts.
            migrationBuilder.Sql("""
                UPDATE "AspNetUsers"
                SET "IsSysAdmin" = TRUE
                WHERE "NormalizedEmail" = 'KRISTOFER.HOGLIND@GMAIL.COM'
                  AND "Status" = 'Active';
                """);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Preserve operator-managed permissions on rollback; revocation belongs in account administration.

        }
    }
}
