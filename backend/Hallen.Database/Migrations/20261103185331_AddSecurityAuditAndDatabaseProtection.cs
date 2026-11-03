using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hallen.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityAuditAndDatabaseProtection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EntityType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Action = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ChangedFields = table.Column<string[]>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_events", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_CreatedAt",
                table: "audit_events",
                column: "CreatedAt");

            // Keep Hallen tables inaccessible through Supabase public API roles.
            migrationBuilder.Sql("""
DO $security$
DECLARE item record; api_role text;
BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY(ARRAY['AspNetRoleClaims','AspNetRoles','AspNetUserClaims','AspNetUserLogins','AspNetUserRoles','AspNetUserTokens','AspNetUsers','DataProtectionKeys','GameMatchTeamPlayers','GameSessionPlayers','GroupInvitations','SportsGroupMembers','__EFMigrationsHistory','audit_events','game_match_team_results','game_matches','game_sessions','game_team_players','game_teams','players','session_templates','sports_groups']) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',item.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',item.tablename);
    FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT FROM pg_roles WHERE rolname=api_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',item.tablename,api_role);
      END IF;
    END LOOP;
    IF EXISTS(SELECT FROM pg_roles WHERE rolname='hallen_runtime') THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO hallen_runtime',item.tablename);
      EXECUTE format('DROP POLICY IF EXISTS hallen_backend ON public.%I',item.tablename);
      EXECUTE format('CREATE POLICY hallen_backend ON public.%I TO hallen_runtime USING (true) WITH CHECK (true)',item.tablename);
    END IF;
  END LOOP;
  FOREACH api_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT FROM pg_roles WHERE rolname=api_role) THEN
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I',api_role);
    END IF;
  END LOOP;
  IF EXISTS(SELECT FROM pg_roles WHERE rolname='hallen_runtime') THEN
    GRANT USAGE ON SCHEMA public TO hallen_runtime;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hallen_runtime;
    REVOKE UPDATE, DELETE ON public.audit_events FROM hallen_runtime;
  END IF;
END $security$;
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_events");
        }
    }
}
