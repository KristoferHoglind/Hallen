-- Run with the migration/database owner in Supabase SQL Editor.
-- Creates NO password. Set a unique password separately with psql \password hallen_runtime.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hallen_runtime') THEN
    CREATE ROLE hallen_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;
GRANT CONNECT ON DATABASE postgres TO hallen_runtime;
GRANT USAGE ON SCHEMA public TO hallen_runtime;
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND
    tablename = ANY(ARRAY['AspNetRoleClaims','AspNetRoles','AspNetUserClaims','AspNetUserLogins','AspNetUserRoles','AspNetUserTokens','AspNetUsers','DataProtectionKeys','GameMatchTeamPlayers','GameSessionPlayers','GroupInvitations','SportsGroupMembers','__EFMigrationsHistory','audit_events','game_match_team_results','game_matches','game_sessions','game_team_players','game_teams','players','session_templates','sports_groups'])
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO hallen_runtime',item.tablename);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',item.tablename);
    EXECUTE format('DROP POLICY IF EXISTS hallen_backend ON public.%I',item.tablename);
    EXECUTE format('CREATE POLICY hallen_backend ON public.%I TO hallen_runtime USING (true) WITH CHECK (true)',item.tablename);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hallen_runtime;
-- Log rows can be appended/read by the app, never edited/deleted by its DB role.
REVOKE UPDATE, DELETE ON public.audit_events FROM hallen_runtime;
-- Schema changes belong to the separate migration connection, never the web app.
REVOKE CREATE ON SCHEMA public FROM hallen_runtime;
