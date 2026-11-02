#!/usr/bin/env python3
"""Exercise the production image against a disposable PostgreSQL database.

Requires Docker and Python 3. No application credentials or existing databases
are used. All containers and the network created here are removed on exit.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import http.client
import hashlib
import json
import re
import secrets
import subprocess
import time
import uuid


def docker(*args):
    return subprocess.run(["docker", *args], check=True, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout.strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", default="hallen:demo")
    args = parser.parse_args()
    suffix = uuid.uuid4().hex[:10]
    network, db, app = ["hallen-smoke-" + suffix + tail for tail in ("", "-db", "-app")]
    password = secrets.token_hex(24)
    port = None

    def request(method, path, data=None, cookie=None, proxy=True):
        # This simulates TLS termination only on the loopback-only test binding.
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=30)
        headers = {"X-Forwarded-Proto": "https"} if proxy else {}
        if data is not None:
            headers["Content-Type"] = "application/json"
        if cookie:
            headers["Cookie"] = cookie
        try:
            conn.request(method, path, json.dumps(data) if data is not None else None, headers)
            response = conn.getresponse()
            body = response.read().decode()
            return response.status, {key.lower(): value for key, value in response.getheaders()}, body
        finally:
            conn.close()

    def api(method, path, data=None, cookie=None, expected=200):
        status, headers, body = request(method, path, data, cookie)
        assert status == expected, f"{method} {path}: expected {expected}, got {status}: {body[:300]}"
        value = json.loads(body) if body and "application/json" in headers.get("content-type", "") else body or None
        return value, headers

    def wait_ready():
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            try:
                if request("GET", "/readyz")[0] == 200:
                    return
            except (OSError, http.client.HTTPException):
                pass
            time.sleep(.5)
        raise AssertionError("Container did not become ready")

    try:
        docker("network", "create", network)
        docker("run", "-d", "--name", db, "--network", network,
               "-e", "POSTGRES_DB=hallen_test", "-e", "POSTGRES_USER=hallen",
               "-e", "POSTGRES_PASSWORD=" + password, "postgres:17")
        for _ in range(60):
            probe = subprocess.run(["docker", "exec", db, "pg_isready", "-U", "hallen", "-d", "hallen_test"],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if probe.returncode == 0:
                break
            time.sleep(.5)
        else:
            raise AssertionError("Test PostgreSQL did not start")

        def start_app(bootstrap=True, environment="Production"):
            docker("run", "-d", "--name", app, "--network", network, "--memory", "512m",
                   "-p", "127.0.0.1::10000",
                   "-e", "ConnectionStrings__DefaultConnection=Host=" + db + ";Database=hallen_test;Username=hallen;Password=" + password + ";Maximum Pool Size=10",
                   "-e", "ASPNETCORE_ENVIRONMENT=" + environment,
                   "-e", "RateLimiting__AuthPermitLimit=200",
                   "-e", "Database__MigrateOnStartup=true",
                   "-e", "Registration__AllowBootstrap=" + str(bootstrap).lower(),
                   "-e", "ASPNETCORE_FORWARDEDHEADERS_ENABLED=true", args.image)
            return int(docker("port", app, "10000/tcp").rsplit(":", 1)[1])

        port = start_app(bootstrap=False)
        wait_ready()
        assert request("GET", "/healthz", proxy=False)[0] == 200
        assert request("GET", "/api/auth/me", proxy=False)[0] in (307, 308)
        for path in ("/", "/spela", "/grupper", "/medlemmar", "/inbjudan"):
            status, headers, body = request("GET", path)
            assert status == 200 and '<div id="root">' in body, path
            assert headers.get("cache-control") == "no-cache", path
        status, _, body = request("GET", "/index.html")
        assets = re.findall(r'src="(/assets/[^\"]+\.js)"', body)
        assert assets, "React bundle missing"
        assert "https://localhost:7251" not in request("GET", assets[0])[2]
        assert request("GET", "/api/does-not-exist")[0] == 404
        assert request("GET", "/swagger/v1/swagger.json")[0] == 404
        assert request("GET", "/api/sports-groups")[0] == 401
        print("OK: fresh migrations, SPA routes, cache headers, production API URL and anonymous access")

        assert api("GET", "/api/auth/registration")[0]["bootstrapAllowed"] is False
        assert request("POST", "/api/auth/register", {
            "email": "uninvited@example.test", "displayName": "Uninvited", "password": "Smoke-test-12345"})[0] == 400
        print("OK: even an empty production database rejects signup without explicit bootstrap")
        docker("rm", "-f", "-v", app)
        port = start_app(bootstrap=True)
        wait_ready()

        def register(label, token=None):
            user, headers = api("POST", "/api/auth/register", {
                "email": label + "@example.test", "displayName": label, "password": "Smoke-test-12345", "invitationToken": token})
            set_cookie = headers["set-cookie"]
            assert "secure" in set_cookie.lower() and "httponly" in set_cookie.lower()
            assert "samesite=lax" in set_cookie.lower()
            return user, set_cookie.split(";", 1)[0]

        owner, cookie = register("owner")
        assert api("GET", "/api/sports-groups", cookie=cookie)[0] == [], "Production must not seed demo data"
        group, _ = api("POST", "/api/sports-groups", {"name": "Container test"}, cookie, 201)
        group_path = "/api/sports-groups/" + group["id"]
        players = [api("POST", group_path + "/players", {"name": name}, cookie, 201)[0]
                   for name in ("Alex", "Kim")]
        session, _ = api("POST", group_path + "/game-sessions", {
            "name": "Test session", "startsAt": datetime.now(timezone.utc).isoformat(),
            "numberOfTeams": 2, "playerIds": [p["id"] for p in players]}, cookie, 201)
        session_path = "/api/game-sessions/" + session["id"]
        setup, _ = api("POST", session_path + "/teams/randomize", cookie=cookie)
        team_ids = [team["id"] for team in setup["teams"]]
        team_path = "/api/game-teams/" + team_ids[0]
        api("PUT", team_path, {"name": "Renamed team"}, expected=401)
        other_group, _ = api("POST", "/api/sports-groups", {"name": "Other group"}, cookie, 201)
        invite_path = "/api/sports-groups/" + other_group["id"] + "/invitations"
        created, _ = api("POST", invite_path, {"role": "Member"}, cookie)
        outsider, outsider_cookie = register("outsider", created["token"])
        assert outsider["isSysAdmin"] is False and outsider["canCreateGroups"] is False
        api("POST", "/api/sports-groups", {"name": "Blocked group invitation privilege"}, outsider_cookie, 403)
        assert api("GET", "/api/auth/me", cookie=outsider_cookie)[0]["canCreateGroups"] is False
        api("PUT", "/api/accounts/" + outsider["id"] + "/permissions", {"isSysAdmin": False, "canCreateGroups": True}, cookie, 204)
        membership = api("GET", "/api/sports-groups/" + other_group["id"], cookie=outsider_cookie)[0]
        assert membership["currentUserRole"] == "Member" and not membership["canManage"]
        own_group, _ = api("POST", "/api/sports-groups", {"name": "Invited user's own group"}, outsider_cookie, 201)
        assert own_group["isOwner"] and own_group["currentUserRole"] == "Owner"
        assert request("POST", invite_path, {"role": "Member"}, outsider_cookie)[0] == 403
        assert request("GET", invite_path, cookie=outsider_cookie)[0] == 403
        assert api("GET", group_path + "/members", cookie=outsider_cookie)[0] == []
        other_members = api("GET", "/api/sports-groups/" + other_group["id"] + "/members", cookie=outsider_cookie)[0]
        assert any(row["appUserId"] == owner["id"] and row["role"] == "Owner" for row in other_members)
        assert any(row["appUserId"] == outsider["id"] and row["role"] == "Member" for row in other_members)
        print("OK: group invite cannot create groups; only explicit sysadmin grant enables group creation")
        status, _, _ = request("PUT", team_path, {"name": "Not allowed"}, outsider_cookie)
        assert status in (400, 403, 404), "Non-member renamed another group's team"
        api("PUT", team_path, {"name": "Renamed team"}, cookie)
        setup, _ = api("POST", session_path + "/players/reset", cookie=cookie)
        assert all(not p["isAssignedToTeam"] for p in setup["participants"])
        assert all(not team["players"] for team in setup["teams"])
        print("OK: production cookies, group/player/session creation, team permissions and player reset")

        # Description is independent from renaming and is readable by approved members only.
        api("PUT", group_path + "/description", {"description": "Innebandy varje måndag kl. 16.00."}, cookie, 204)
        assert api("GET", group_path, cookie=cookie)[0]["description"] == "Innebandy varje måndag kl. 16.00."
        assert next(row for row in api("GET", "/api/sports-groups", cookie=cookie)[0] if row["id"] == group["id"])["description"] == "Innebandy varje måndag kl. 16.00."
        api("PUT", group_path + "/description", {"description": "x" * 2001}, cookie, 400)
        api("PUT", group_path + "/description", {"description": "Forbidden"}, outsider_cookie, 403)
        api("GET", group_path + "/statistics", cookie=outsider_cookie, expected=403)
        api("GET", group_path + "/statistics", expected=401)
        idle_player = api("POST", "/api/sports-groups/" + own_group["id"] + "/players", {"name": "No matches yet"}, outsider_cookie, 201)[0]
        empty_stats = api("GET", "/api/sports-groups/" + own_group["id"] + "/statistics", cookie=outsider_cookie)[0]
        assert empty_stats["matches"] == 0 and empty_stats["averageScore"] == 0 and empty_stats["highestScoringMatch"] is None
        assert empty_stats["players"] == 0 and len(empty_stats["playerStandings"]) == 1
        assert empty_stats["playerStandings"][0]["playerId"] == idle_player["id"] and empty_stats["playerStandings"][0]["matches"] == 0
        for player, team in zip(players, team_ids):
            api("PUT", session_path + "/players/" + player["id"] + "/team", {"gameTeamId": team}, cookie)
        def match_body(teams, scores, winner=None):
            return {"teamResults": [{"gameTeamId": team, "score": score} for team, score in zip(teams, scores)], "winnerGameTeamId": winner}
        first_match = api("POST", session_path + "/matches", match_body(team_ids, [3, 1]), cookie, 201)[0]
        # Batch moves are all-or-nothing and never rewrite saved match lineups.
        batch_path = session_path + "/players/team"
        batch_ids = [p["id"] for p in players]
        api("PUT", batch_path, {"playerIds": batch_ids, "gameTeamId": team_ids[0]}, expected=401)
        api("PUT", batch_path, {"playerIds": batch_ids, "gameTeamId": team_ids[0]}, outsider_cookie, 400)
        before_batch = api("GET", session_path + "/setup", cookie=cookie)[0]
        api("PUT", batch_path, {"playerIds": [batch_ids[0], str(uuid.uuid4())], "gameTeamId": team_ids[1]}, cookie, 400)
        api("PUT", batch_path, {"playerIds": batch_ids, "gameTeamId": str(uuid.uuid4())}, cookie, 400)
        api("PUT", batch_path, {"playerIds": [], "gameTeamId": None}, cookie, 400)
        assert api("GET", session_path + "/setup", cookie=cookie)[0] == before_batch
        moved = api("PUT", batch_path, {"playerIds": batch_ids + [batch_ids[0]], "gameTeamId": team_ids[0]}, cookie)[0]
        assert all(p["gameTeamId"] == team_ids[0] for p in moved["participants"])
        assert sum(len(t["players"]) for t in moved["teams"]) == len(batch_ids)
        assert api("PUT", batch_path, {"playerIds": batch_ids, "gameTeamId": team_ids[0]}, cookie)[0] == moved
        unassigned = api("PUT", batch_path, {"playerIds": batch_ids, "gameTeamId": None}, cookie)[0]
        assert all(not p["isAssignedToTeam"] for p in unassigned["participants"])
        assert api("GET", "/api/game-matches/" + first_match["id"], cookie=cookie)[0] == first_match
        for player, team in zip(players, team_ids):
            api("PUT", session_path + "/players/" + player["id"] + "/team", {"gameTeamId": team}, cookie)
        print("OK: atomic batch moves, duplicate/same-team handling, unassignment, validation, permissions and saved lineups")
        # Change attendance after a match without rewriting its player snapshots.
        participants_path = session_path + "/players"
        api("PUT", participants_path, {"playerIds": []}, expected=401)
        api("PUT", participants_path, {"playerIds": []}, outsider_cookie, 400)
        api("PUT", participants_path, {"playerIds": [str(uuid.uuid4())]}, cookie, 400)
        changed = api("PUT", participants_path, {"playerIds": [players[1]["id"]]}, cookie)[0]
        assert [p["playerId"] for p in changed["participants"]] == [players[1]["id"]]
        assert not any(p["playerId"] == players[0]["id"] for t in changed["teams"] for p in t["players"])
        assert api("GET", "/api/game-matches/" + first_match["id"], cookie=cookie)[0] == first_match
        restored = api("PUT", participants_path, {"playerIds": [p["id"] for p in players]}, cookie)[0]
        assert not next(p for p in restored["participants"] if p["playerId"] == players[0]["id"])["isAssignedToTeam"]
        assert next(p for p in restored["participants"] if p["playerId"] == players[1]["id"])["isAssignedToTeam"]
        emptied = api("PUT", participants_path, {"playerIds": []}, cookie)[0]
        assert not emptied["participants"] and all(not t["players"] for t in emptied["teams"])
        assert {t["id"]: t["name"] for t in emptied["teams"]} == {t["id"]: t["name"] for t in restored["teams"]}
        api("PUT", participants_path, {"playerIds": [p["id"] for p in players]}, cookie)
        for player, team in zip(players, team_ids):
            api("PUT", session_path + "/players/" + player["id"] + "/team", {"gameTeamId": team}, cookie)
        assert api("GET", "/api/game-matches/" + first_match["id"], cookie=cookie)[0] == first_match
        print("OK: session attendance can change, including zero players; assignments and match history preserved")
        second_session = api("POST", group_path + "/game-sessions", {"name": "Second session", "startsAt": datetime.now(timezone.utc).isoformat(), "numberOfTeams": 2, "playerIds": [p["id"] for p in players]}, cookie, 201)[0]
        second_path = "/api/game-sessions/" + second_session["id"]
        second_setup = api("GET", second_path + "/setup", cookie=cookie)[0]
        second_teams = [team["id"] for team in second_setup["teams"]]
        for player, team in zip(reversed(players), second_teams):
            api("PUT", second_path + "/players/" + player["id"] + "/team", {"gameTeamId": team}, cookie)
        tiebreak = api("POST", second_path + "/matches", match_body(second_teams, [2, 2], second_teams[0]), cookie, 201)[0]
        api("POST", second_path + "/matches", match_body(second_teams, [0, 0]), cookie, 201)
        unfinished = api("POST", second_path + "/matches", match_body(second_teams, [99, 99]), cookie, 201)[0]
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c", "UPDATE game_matches SET finished_at = NULL WHERE id = '" + unfinished["id"] + "';")
        api("POST", second_path + "/players/reset", cookie=cookie)
        statistics = api("GET", group_path + "/statistics", cookie=cookie)[0]
        assert (statistics["sessions"], statistics["playedSessions"], statistics["matches"], statistics["totalScore"], statistics["draws"], statistics["tiebreaks"], statistics["players"], statistics["averageScore"]) == (2, 2, 3, 8, 1, 1, 2, 2.7), statistics
        assert statistics["biggestWin"]["margin"] == 2 and statistics["highestScoringMatch"]["totalScore"] == 4
        assert all((p["matches"], p["wins"], p["draws"], p["losses"]) == (3, 1, 1, 1) for p in statistics["playerStandings"])
        api("PUT", "/api/game-matches/" + first_match["id"], match_body(team_ids, [5, 1]), cookie)
        assert api("GET", group_path + "/statistics", cookie=cookie)[0]["totalScore"] == 10
        api("DELETE", "/api/game-matches/" + tiebreak["id"], cookie=cookie, expected=204)
        after_delete = api("GET", group_path + "/statistics", cookie=cookie)[0]
        assert after_delete["matches"] == 2 and after_delete["totalScore"] == 6 and after_delete["tiebreaks"] == 0
        extra_players = [api("POST", group_path + "/players", {"name": "Roster player " + str(index)}, cookie, 201)[0] for index in range(11)]
        api("PUT", "/api/players/" + extra_players[0]["id"], {"name": "Inactive roster player", "isActive": False}, cookie, 204)
        api("PUT", "/api/players/" + players[0]["id"], {"name": "Alex renamed", "isActive": True}, cookie, 204)
        roster_statistics = api("GET", group_path + "/statistics", cookie=cookie)[0]
        assert len(roster_statistics["playerStandings"]) == 13 and roster_statistics["players"] == 2
        idle_rows = [row for row in roster_statistics["playerStandings"] if row["playerId"] in [player["id"] for player in extra_players]]
        assert len(idle_rows) == 11 and all(row["matches"] == row["wins"] == row["draws"] == row["losses"] == 0 for row in idle_rows)
        assert any(row["playerName"] == "Inactive roster player" for row in idle_rows)
        assert next(row for row in roster_statistics["playerStandings"] if row["playerId"] == players[0]["id"])["playerName"] == "Alex renamed"
        print("OK: entire roster exceeds ten rows and includes inactive/zero-match players and current player names")
        # March 29 is a 23-hour day in Stockholm in 2026. Include midnight and the final microsecond.
        api("PUT", session_path, {"name": "First boundary session", "startsAt": "2026-03-28T23:00:00Z"}, cookie, 204)
        api("PUT", second_path, {"name": "Next day session", "startsAt": "2026-03-29T22:00:00Z"}, cookie, 204)
        boundary_session = api("POST", group_path + "/game-sessions", {"name": "Last instant session", "startsAt": "2026-03-29T21:59:59.999999Z", "numberOfTeams": 2, "playerIds": [p["id"] for p in players]}, cookie, 201)[0]
        boundary_path = "/api/game-sessions/" + boundary_session["id"]
        boundary_setup = api("GET", boundary_path + "/setup", cookie=cookie)[0]
        boundary_teams = [team["id"] for team in boundary_setup["teams"]]
        api("POST", boundary_path + "/matches", match_body(boundary_teams, [7, 0]), cookie, 201)
        day_stats = api("GET", group_path + "/statistics?fromDate=2026-03-29&toDate=2026-03-29", cookie=cookie)[0]
        assert (day_stats["sessions"], day_stats["matches"], day_stats["totalScore"]) == (2, 2, 13), day_stats
        assert day_stats["highestScoringMatch"]["sessionName"] == "Last instant session"
        assert len(day_stats["playerStandings"]) == 13 and day_stats["draws"] == 0
        assert api("GET", group_path + "/statistics?toDate=2026-03-28", cookie=cookie)[0]["matches"] == 0
        next_day = api("GET", group_path + "/statistics?fromDate=2026-03-30", cookie=cookie)[0]
        assert next_day["sessions"] == next_day["matches"] == next_day["draws"] == 1 and next_day["totalScore"] == 0
        api("GET", group_path + "/statistics?fromDate=2026-03-30&toDate=2026-03-29", cookie=cookie, expected=400)
        api("GET", group_path + "/statistics?fromDate=not-a-date", cookie=cookie, expected=400)
        all_time = api("GET", group_path + "/statistics", cookie=cookie)[0]
        assert all_time["sessions"] == all_time["matches"] == 3 and all_time["totalScore"] == 13
        print("OK: optional inclusive session date filters, Stockholm DST boundaries, all-time default, full roster and invalid ranges")
        print("OK: description permissions and cross-session statistics, saved lineups, tiebreaks, unfinished matches, edits and deletions")

        # Registration is closed even with bootstrap enabled once the first user exists.
        assert api("GET", "/api/auth/registration")[0]["bootstrapAllowed"] is False
        blocked = {"email": "blocked@example.test", "displayName": "Blocked", "password": "Smoke-test-12345"}
        assert request("POST", "/api/auth/register", blocked)[0] == 400
        assert request("POST", "/api/auth/register", {**blocked, "invitationToken": created["token"]})[0] == 400

        def create_invitation(role="Member"):
            return api("POST", group_path + "/invitations", {"role": role}, cookie)[0]
        def preview(token):
            return request("POST", "/api/invitations/preview", {"token": token})[0]
        fresh = create_invitation()
        assert preview(fresh["token"]) == 200
        stored = docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-Atc",
                        'SELECT "TokenHash" FROM "GroupInvitations" WHERE "Id" = \'' + fresh["invitation"]["id"] + "'")
        assert stored == hashlib.sha256(fresh["token"].encode()).hexdigest().upper()
        listed = api("GET", group_path + "/invitations", cookie=cookie)[0]
        assert all("token" not in item and "tokenHash" not in item for item in listed)
        # Invalid password must not consume an otherwise valid invitation.
        assert request("POST", "/api/auth/register", {**blocked, "password": "x", "invitationToken": fresh["token"]})[0] == 400
        assert preview(fresh["token"]) == 200
        revoked = create_invitation()
        api("DELETE", group_path + "/invitations/" + revoked["invitation"]["id"], cookie=cookie, expected=204)
        assert preview(revoked["token"]) == 400
        expired = create_invitation()
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c",
               'UPDATE "GroupInvitations" SET "ExpiresAt" = now() - interval \'1 second\' WHERE "Id" = \'' + expired["invitation"]["id"] + "'")
        assert preview(expired["token"]) == 400
        # Two concurrent registrations must not turn one token into two accounts.
        concurrent = create_invitation()
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda index: request("POST", "/api/auth/register", {
                "email": f"concurrent{index}@example.test", "displayName": f"Concurrent {index}",
                "password": "Smoke-test-12345", "invitationToken": concurrent["token"]})[0], range(2)))
        assert sorted(statuses) == [200, 400], statuses
        assert preview(concurrent["token"]) == 400
        # Existing users can also accept an invitation, without replacing their role elsewhere.
        accepted, _ = api("POST", "/api/invitations/accept", {"token": fresh["token"]}, outsider_cookie)
        assert accepted["sportsGroupId"] == group["id"]
        assert api("GET", "/api/auth/me", cookie=outsider_cookie)[0]["canCreateGroups"] is True
        readable_members = api("GET", group_path + "/members", cookie=outsider_cookie)[0]
        assert any(row["appUserId"] == owner["id"] and row["role"] == "Owner" for row in readable_members)
        readable_sessions = api("GET", group_path + "/game-sessions", cookie=outsider_cookie)[0]
        assert any(item["id"] == session["id"] for item in readable_sessions)
        readable_matches = api("GET", session_path + "/matches", cookie=outsider_cookie)[0]
        assert any(item["id"] == first_match["id"] for item in readable_matches)
        assert api("GET", session_path + "/setup", cookie=outsider_cookie)[0]["sportsGroupId"] == group["id"]
        print("OK: group member can load the session selector, match results and teams for the read-only group results view")
        print("OK: approved members can read the group directory while non-members cannot")
        api("GET", group_path + "/statistics", cookie=outsider_cookie)
        api("PUT", group_path + "/description", {"description": "Forbidden member edit"}, outsider_cookie, 403)
        assert api("GET", "/api/sports-groups/" + own_group["id"], cookie=outsider_cookie)[0]["isOwner"]
        # Admins may invite members, but cannot grant ownership or admin access.
        admin_invite = create_invitation("Admin")
        admin, admin_cookie = register("admin", admin_invite["token"])
        assert admin["canCreateGroups"] is False
        api("POST", "/api/sports-groups", {"name": "Blocked admin invite privilege"}, admin_cookie, 403)
        api("PUT", group_path + "/description", {"description": "Updated by group admin"}, admin_cookie, 204)
        assert request("POST", group_path + "/invitations", {"role": "Owner"}, admin_cookie)[0] == 400
        assert request("POST", group_path + "/invitations", {"role": "Admin"}, admin_cookie)[0] == 403
        admin_link = api("POST", group_path + "/invitations", {"role": "Member"}, admin_cookie)[0]
        recovery_group = "/api/password-recovery/groups/" + group["id"] + "/users/"
        api("POST", recovery_group + outsider["id"], {}, admin_cookie)
        api("POST", recovery_group + owner["id"], {}, admin_cookie, 403)
        api("POST", recovery_group + admin["id"], {}, outsider_cookie, 403)
        api("POST", recovery_group + owner["id"], {}, cookie, 403)
        api("POST", "/api/password-recovery/groups/" + own_group["id"] + "/users/" + admin["id"], {}, outsider_cookie, 403)
        member_rows = api("GET", group_path + "/members", cookie=cookie)[0]
        admin_member = next(row for row in member_rows if row["appUserId"] == admin["id"])
        api("PUT", group_path + "/members/" + admin_member["id"] + "/role", {"role": "Member"}, cookie)
        assert preview(admin_link["token"]) == 400
        print("OK: hashed tokens, closed signup, rollback on invalid password, expiry, revocation, single-use concurrency, existing-user acceptance and role boundaries")

        locked_invite = create_invitation()
        register("locked", locked_invite["token"])
        for _ in range(5):
            assert request("POST", "/api/auth/login", {"email": "locked@example.test", "password": "incorrect-password"})[0] == 401
        assert request("POST", "/api/auth/login", {"email": "locked@example.test", "password": "Smoke-test-12345"})[0] == 401
        print("OK: repeated incorrect passwords temporarily lock the account")

        recovery = "/api/password-recovery"
        api("GET", recovery + "/users", expected=401)
        api("GET", recovery + "/users", cookie=outsider_cookie, expected=403)
        api("POST", recovery + "/users/" + outsider["id"], {}, outsider_cookie, 403)
        accounts = api("GET", recovery + "/users", cookie=cookie)[0]
        assert any(account["id"] == outsider["id"] for account in accounts)
        reset = api("POST", recovery + "/users/" + outsider["id"], {}, cookie)[0]
        reset = api("POST", recovery_group + outsider["id"], {}, cookie)[0]
        api("POST", recovery_group + outsider["id"], {}, admin_cookie, 403)
        payload = {"userId": outsider["id"], "token": reset["token"], "password": "Replacement-12345"}
        api("POST", recovery + "/reset", {**payload, "password": "weak"}, expected=400)
        assert request("POST", recovery + "/reset", {**payload, "token": "invalid"})[0] == 400
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda _: request("POST", recovery + "/reset", payload)[0], range(2)))
        assert sorted(statuses) == [204, 400], statuses
        api("GET", "/api/auth/me", cookie=outsider_cookie, expected=401)
        api("POST", "/api/auth/login", {"email": "outsider@example.test", "password": "Smoke-test-12345"}, expected=401)
        _, renewed_outsider = api("POST", "/api/auth/login", {"email": "outsider@example.test", "password": "Replacement-12345"})
        outsider_cookie = renewed_outsider["set-cookie"].split(";", 1)[0]
        locked_user = next(account for account in api("GET", recovery + "/users", cookie=cookie)[0] if account["email"] == "locked@example.test")
        locked_reset = api("POST", recovery + "/users/" + locked_user["id"], {}, cookie)[0]
        api("POST", recovery + "/reset", {"userId": locked_user["id"], "token": locked_reset["token"], "password": "Replacement-12345"}, expected=204)
        api("POST", "/api/auth/login", {"email": "locked@example.test", "password": "Replacement-12345"})
        print("OK: sysadmin-only recovery, invalid password rollback, single-use concurrent reset, old cookies revoked and account unlocked")

        # Account permissions are system-wide and are checked against current DB state.
        api("GET", "/api/accounts", expected=401)
        api("GET", "/api/accounts", cookie=admin_cookie, expected=403)
        account_path = "/api/accounts/" + admin["id"] + "/permissions"
        api("PUT", account_path, {"isSysAdmin": True, "canCreateGroups": True}, admin_cookie, 403)
        owner_permissions = "/api/accounts/" + owner["id"] + "/permissions"
        api("PUT", owner_permissions, {"isSysAdmin": False, "canCreateGroups": True}, cookie, 400)
        api("PUT", account_path, {"isSysAdmin": False, "canCreateGroups": False}, cookie, 204)
        assert api("GET", "/api/auth/me", cookie=admin_cookie)[0]["canCreateGroups"] is False
        api("POST", "/api/sports-groups", {"name": "Blocked creation"}, admin_cookie, 403)
        assert api("GET", group_path, cookie=admin_cookie)[0]["id"] == group["id"]
        api("PUT", account_path, {"isSysAdmin": True, "canCreateGroups": True}, cookie, 204)
        assert api("GET", "/api/auth/me", cookie=admin_cookie)[0]["isSysAdmin"] is True
        api("GET", "/api/accounts", cookie=admin_cookie)
        api("POST", "/api/sports-groups", {"name": "Restored creation"}, admin_cookie, 201)
        hallen_path = "/api/accounts/invitations"
        api("GET", hallen_path, expected=401)
        api("POST", hallen_path, {}, expected=401)
        # A group owner without system permissions cannot issue account-only invitations.
        hallen_link = api("POST", hallen_path, {"role": "Owner", "isSysAdmin": True}, admin_cookie)[0]
        assert hallen_link["invitation"]["sportsGroupId"] is None and hallen_link["invitation"]["groupName"] is None
        assert preview(hallen_link["token"]) == 200
        hallen_user, hallen_cookie = register("no-group", hallen_link["token"])
        assert not hallen_user["isSysAdmin"] and hallen_user["canCreateGroups"]
        assert api("GET", "/api/sports-groups", cookie=hallen_cookie)[0] == []
        api("GET", hallen_path, cookie=hallen_cookie, expected=403)
        api("POST", hallen_path, {}, hallen_cookie, 403)
        assert preview(hallen_link["token"]) == 400
        new_group = api("POST", "/api/sports-groups", {"name": "First own group"}, hallen_cookie, 201)[0]
        assert new_group["isOwner"]
        revoked_hallen = api("POST", hallen_path, {}, admin_cookie)[0]
        api("DELETE", hallen_path + "/" + revoked_hallen["invitation"]["id"], cookie=hallen_cookie, expected=403)
        api("DELETE", group_path + "/invitations/" + revoked_hallen["invitation"]["id"], cookie=cookie, expected=400)
        api("DELETE", hallen_path + "/" + revoked_hallen["invitation"]["id"], cookie=admin_cookie, expected=204)
        assert preview(revoked_hallen["token"]) == 400
        hallen_race = api("POST", hallen_path, {}, admin_cookie)[0]
        api("POST", "/api/invitations/accept", {"token": hallen_race["token"]}, hallen_cookie, 400)
        assert preview(hallen_race["token"]) == 200
        with ThreadPoolExecutor(max_workers=2) as pool:
            statuses = list(pool.map(lambda number: request("POST", "/api/auth/register", {
                "email": f"hallen-race-{number}@example.test", "displayName": "New account", "password": "Smoke-test-12345", "invitationToken": hallen_race["token"]})[0], range(2)))
        assert sorted(statuses) == [200, 400], statuses
        untrusted_issuer = api("POST", hallen_path, {}, admin_cookie)[0]
        listed = api("GET", hallen_path, cookie=admin_cookie)[0]
        assert all(item["sportsGroupId"] is None and "token" not in item and "tokenHash" not in item for item in listed)
        print("OK: account-only invitations create no memberships, permit own groups and enforce system permissions, revocation and single use")
        def demote(entry):
            path, admin_auth = entry
            return request("PUT", path, {"isSysAdmin": False, "canCreateGroups": True}, admin_auth)[0]
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(demote, [(owner_permissions, cookie), (account_path, admin_cookie)]))
        assert sorted(results) == [204, 400], results
        owner_is_admin = api("GET", "/api/auth/me", cookie=cookie)[0]["isSysAdmin"]
        remaining_cookie = cookie if owner_is_admin else admin_cookie
        api("PUT", owner_permissions, {"isSysAdmin": True, "canCreateGroups": True}, remaining_cookie, 204)
        api("PUT", account_path, {"isSysAdmin": False, "canCreateGroups": True}, cookie, 204)
        api("GET", "/api/accounts", cookie=admin_cookie, expected=403)
        assert preview(untrusted_issuer["token"]) == 400
        api("POST", hallen_path, {}, admin_cookie, 403)
        print("OK: multiple system admins, immediate revocation, group creation permissions and concurrent last-admin protection")

        # Owner changes require the dedicated transfer action; group/system roles are independent.
        rows = api("GET", group_path + "/members", cookie=cookie)[0]
        owner_member = next(row for row in rows if row["appUserId"] == owner["id"])
        member_target = next(row for row in rows if row["appUserId"] == outsider["id"])
        admin_target = next(row for row in rows if row["appUserId"] == admin["id"])
        member_url = group_path + "/members/"
        def transfer_url(member): return member_url + member["id"] + "/transfer-ownership"
        api("PUT", member_url + owner_member["id"] + "/role", {"role": "Admin"}, cookie, 400)
        api("PUT", member_url + owner_member["id"] + "/role", {"role": "Owner"}, cookie, 400)
        api("DELETE", member_url + owner_member["id"], cookie=cookie, expected=400)
        api("PUT", member_url + member_target["id"] + "/role", {"role": "Owner"}, cookie, 400)
        api("PUT", member_url + member_target["id"] + "/role", {"role": "999"}, cookie, 400)
        api("POST", group_path + "/members", {"email": "outsider@example.test", "role": "Owner"}, cookie, 400)
        api("POST", group_path + "/invitations", {"role": "Owner"}, cookie, 400)
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Admin"}, cookie)
        promoted = api("PUT", member_url + member_target["id"] + "/role", {"role": "Admin"}, admin_cookie)[0]
        assert promoted["role"] == "Admin"
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Member"}, outsider_cookie)
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Admin"}, admin_cookie, 400)
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Admin"}, outsider_cookie)
        self_demotion = api("PUT", member_url + admin_target["id"] + "/role", {"role": "Member"}, admin_cookie)[0]
        assert self_demotion["role"] == "Member"
        self_group = api("GET", group_path, cookie=admin_cookie)[0]
        assert self_group["currentUserRole"] == "Member" and not self_group["canManage"]
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Admin"}, admin_cookie, 400)
        api("PUT", member_url + member_target["id"] + "/role", {"role": "Member"}, admin_cookie, 400)
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Admin"}, outsider_cookie)
        api("PUT", member_url + owner_member["id"] + "/role", {"role": "Member"}, admin_cookie, 400)
        api("PUT", member_url + owner_member["id"] + "/role", {"role": "Admin"}, admin_cookie, 400)
        api("PUT", member_url + member_target["id"] + "/role", {"role": "Member"}, admin_cookie)
        print("OK: admins edit other Admin/Member roles and demote themselves; members cannot regain privileges and owners stay protected")
        api("PUT", member_url + member_target["id"] + "/role", {"role": "Admin"}, outsider_cookie, 400)
        api("PUT", member_url + admin_target["id"] + "/role", {"role": "Owner"}, admin_cookie, 400)
        api("DELETE", group_path, cookie=admin_cookie, expected=404)
        api("DELETE", group_path, cookie=outsider_cookie, expected=404)
        api("POST", transfer_url(member_target), {}, admin_cookie, 400)
        api("POST", transfer_url(admin_target), {}, outsider_cookie, 400)
        api("POST", transfer_url(owner_member), {}, cookie, 400)
        foreign_member = api("GET", "/api/sports-groups/" + own_group["id"] + "/members", cookie=outsider_cookie)[0][0]
        api("POST", transfer_url(foreign_member), {}, cookie, 400)
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c", "UPDATE \"SportsGroupMembers\" SET \"Status\" = 'PendingApproval' WHERE \"Id\" = '" + member_target["id"] + "';")
        api("POST", transfer_url(member_target), {}, cookie, 400)
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c", "UPDATE \"SportsGroupMembers\" SET \"Status\" = 'Approved' WHERE \"Id\" = '" + member_target["id"] + "';")
        duplicate_owner = subprocess.run(["docker", "exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-v", "ON_ERROR_STOP=1", "-c", "UPDATE \"SportsGroupMembers\" SET \"Role\" = 'Owner' WHERE \"Id\" = '" + admin_target["id"] + "';"], capture_output=True, text=True)
        assert duplicate_owner.returncode != 0 and "IX_SportsGroupMembers_SportsGroupId" in duplicate_owner.stderr
        with ThreadPoolExecutor(max_workers=2) as pool:
            transfers = list(pool.map(lambda target: request("POST", transfer_url(target), {}, cookie)[0], [member_target, admin_target]))
        assert sorted(transfers) == [204, 400], transfers
        changed_rows = api("GET", group_path + "/members", cookie=cookie)[0]
        new_owners = [row for row in changed_rows if row["role"] == "Owner" and row["status"] == "Approved"]
        assert len(new_owners) == 1
        assert next(row for row in changed_rows if row["id"] == owner_member["id"])["role"] == "Admin"
        changed_group = api("GET", group_path, cookie=cookie)[0]
        assert changed_group["currentUserRole"] == "Admin" and not changed_group["isOwner"] and changed_group["canManage"]
        api("DELETE", group_path, cookie=cookie, expected=404)
        api("POST", transfer_url(owner_member), {}, cookie, 400)
        api("DELETE", member_url + new_owners[0]["id"], cookie=cookie, expected=400)
        next_owner_cookie = outsider_cookie if new_owners[0]["appUserId"] == outsider["id"] else admin_cookie
        api("POST", transfer_url(owner_member), {}, next_owner_cookie, 204)
        assert api("GET", group_path, cookie=cookie)[0]["isOwner"]
        disposable = api("POST", "/api/sports-groups", {"name": "Deletion permission test"}, cookie, 201)[0]
        disposable_path = "/api/sports-groups/" + disposable["id"]
        disposable_member = api("POST", disposable_path + "/members", {"email": "outsider@example.test", "role": "Member"}, cookie)[0]
        api("POST", disposable_path + "/members", {"email": "admin@example.test", "role": "Admin"}, cookie)
        api("DELETE", disposable_path, cookie=admin_cookie, expected=404)
        api("DELETE", disposable_path, cookie=outsider_cookie, expected=404)
        with ThreadPoolExecutor(max_workers=2) as pool:
            deletion = pool.submit(request, "DELETE", disposable_path, None, cookie)
            transfer = pool.submit(request, "POST", disposable_path + "/members/" + disposable_member["id"] + "/transfer-ownership", {}, cookie)
            deletion_status, transfer_status = deletion.result()[0], transfer.result()[0]
        assert (deletion_status, transfer_status) in [(204, 400), (404, 204)], (deletion_status, transfer_status)
        if transfer_status == 204:
            api("DELETE", disposable_path, cookie=cookie, expected=404)
            api("DELETE", disposable_path, cookie=outsider_cookie, expected=204)
        assert api("GET", group_path, cookie=cookie)[0]["isOwner"]
        print("OK: only current owner can delete a group, including concurrent deletion and ownership transfer")
        print("OK: single owner, protected self role, confirmation endpoint, role boundaries, unique index and concurrent ownership transfers")

        # System administrators can inspect all memberships and delete users atomically.
        owner_plan = api("GET", "/api/accounts/" + owner["id"] + "/deletion", cookie=cookie)[0]
        assert owner_plan["isLastSystemAdministrator"]
        api("DELETE", "/api/accounts/" + owner["id"], {"ownershipTransfers": []}, cookie, 400)
        def new_account(label):
            token = api("POST", "/api/accounts/invitations", {}, cookie)[0]["token"]
            return register(label, token)
        doomed, doomed_cookie = new_account("delete-owner")
        successor_a, successor_a_cookie = new_account("successor-a")
        successor_b, successor_b_cookie = new_account("successor-b")
        self_deleting, self_deleting_cookie = new_account("self-deleting-admin")
        deletion_path = "/api/accounts/" + doomed["id"]
        api("GET", deletion_path + "/deletion", expected=401)
        api("DELETE", deletion_path, {"ownershipTransfers": []}, expected=401)
        api("GET", deletion_path + "/deletion", cookie=successor_a_cookie, expected=403)
        api("DELETE", deletion_path, {"ownershipTransfers": []}, successor_a_cookie, 403)
        owned_groups = [api("POST", "/api/sports-groups", {"name": "Account deletion group " + str(index)}, doomed_cookie, 201)[0] for index in range(3)]
        group_paths = ["/api/sports-groups/" + item["id"] for item in owned_groups]
        candidate_a = api("POST", group_paths[0] + "/members", {"email": "successor-a@example.test", "role": "Admin"}, doomed_cookie)[0]
        api("POST", group_paths[1] + "/members", {"email": "successor-a@example.test", "role": "Member"}, doomed_cookie)
        candidate_b = api("POST", group_paths[1] + "/members", {"email": "successor-b@example.test", "role": "Member"}, doomed_cookie)[0]
        initial_plan = api("GET", deletion_path + "/deletion", cookie=cookie)[0]
        assert len(initial_plan["ownedGroups"]) == 3
        assert next(item for item in initial_plan["ownedGroups"] if item["groupId"] == owned_groups[2]["id"])["candidates"] == []
        api("DELETE", deletion_path, {"ownershipTransfers": []}, cookie, 400)
        candidate_solo = api("POST", group_paths[2] + "/members", {"email": "successor-a@example.test", "role": "Member"}, doomed_cookie)[0]
        replacements = [{"groupId": owned_groups[0]["id"], "memberId": candidate_a["id"]},
                        {"groupId": owned_groups[1]["id"], "memberId": candidate_b["id"]},
                        {"groupId": owned_groups[2]["id"], "memberId": candidate_solo["id"]}]
        api("DELETE", deletion_path, {"ownershipTransfers": replacements[:2]}, cookie, 400)
        api("DELETE", deletion_path, {"ownershipTransfers": replacements + [replacements[0]]}, cookie, 400)
        foreign_replacement = {"groupId": owned_groups[0]["id"], "memberId": member_target["id"]}
        api("DELETE", deletion_path, {"ownershipTransfers": [foreign_replacement, *replacements[1:]]}, cookie, 400)
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c", 'UPDATE "SportsGroupMembers" SET "Status" = \'PendingApproval\' WHERE "Id" = \'' + candidate_b["id"] + "';")
        pending_plan = api("GET", deletion_path + "/deletion", cookie=cookie)[0]
        assert all(candidate["memberId"] != candidate_b["id"] for item in pending_plan["ownedGroups"] for candidate in item["candidates"])
        api("DELETE", deletion_path, {"ownershipTransfers": replacements}, cookie, 400)
        assert all(api("GET", path, cookie=doomed_cookie)[0]["isOwner"] for path in group_paths)
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c", 'UPDATE "SportsGroupMembers" SET "Status" = \'Approved\' WHERE "Id" = \'' + candidate_b["id"] + "'; " + 'UPDATE "AspNetUsers" SET "Status" = \'Disabled\' WHERE "Id" = \'' + successor_b["id"] + "';")
        disabled_plan = api("GET", deletion_path + "/deletion", cookie=cookie)[0]
        assert all(candidate["userId"] != successor_b["id"] for item in disabled_plan["ownedGroups"] for candidate in item["candidates"])
        api("DELETE", deletion_path, {"ownershipTransfers": replacements}, cookie, 400)
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c", 'UPDATE "AspNetUsers" SET "Status" = \'Active\' WHERE "Id" = \'' + successor_b["id"] + "';")
        # A stale plan must never perform unrelated transfers or a partial deletion.
        api("POST", group_paths[1] + "/members/" + candidate_b["id"] + "/transfer-ownership", {}, doomed_cookie, 204)
        api("DELETE", deletion_path, {"ownershipTransfers": replacements}, cookie, 400)
        doomed_member = next(item for item in api("GET", group_paths[1] + "/members", cookie=successor_b_cookie)[0] if item["appUserId"] == doomed["id"])
        api("POST", group_paths[1] + "/members/" + doomed_member["id"] + "/transfer-ownership", {}, successor_b_cookie, 204)
        api("PUT", group_paths[1] + "/members/" + candidate_b["id"] + "/role", {"role": "Member"}, doomed_cookie)
        history_players = [api("POST", group_paths[0] + "/players", {"name": name}, doomed_cookie, 201)[0] for name in ["Historical A", "Historical B"]]
        history_session = api("POST", group_paths[0] + "/game-sessions", {"name": "History survives", "startsAt": datetime.now(timezone.utc).isoformat(), "numberOfTeams": 2, "playerIds": [item["id"] for item in history_players]}, doomed_cookie, 201)[0]
        history_path = "/api/game-sessions/" + history_session["id"]
        history_setup = api("GET", history_path + "/setup", cookie=doomed_cookie)[0]
        history_teams = [team["id"] for team in history_setup["teams"]]
        for player, team in zip(history_players, history_teams):
            api("PUT", history_path + "/players/" + player["id"] + "/team", {"gameTeamId": team}, doomed_cookie)
        api("POST", history_path + "/matches", match_body(history_teams, [3, 2]), doomed_cookie, 201)
        api("PUT", deletion_path + "/permissions", {"isSysAdmin": True, "canCreateGroups": True}, cookie, 204)
        doomed_invite = api("POST", "/api/accounts/invitations", {}, doomed_cookie)[0]
        assert preview(doomed_invite["token"]) == 200
        account_overview = api("GET", "/api/accounts", cookie=cookie)[0]
        doomed_overview = next(item for item in account_overview if item["id"] == doomed["id"])
        assert len(doomed_overview["memberships"]) == 3 and all(item["role"] == "Owner" for item in doomed_overview["memberships"])
        api("DELETE", deletion_path, {"ownershipTransfers": replacements}, cookie, 204)
        api("GET", "/api/auth/me", cookie=doomed_cookie, expected=401)
        api("POST", "/api/auth/login", {"email": "delete-owner@example.test", "password": "Smoke-test-12345"}, expected=401)
        assert preview(doomed_invite["token"]) == 400
        assert api("GET", group_paths[0], cookie=successor_a_cookie)[0]["isOwner"]
        assert api("GET", group_paths[1], cookie=successor_b_cookie)[0]["isOwner"]
        assert api("GET", group_paths[2], cookie=successor_a_cookie)[0]["isOwner"]
        historical_stats = api("GET", group_paths[0] + "/statistics", cookie=successor_a_cookie)[0]
        assert historical_stats["matches"] == 1 and historical_stats["totalScore"] == 5 and historical_stats["players"] == 2
        remaining_accounts = api("GET", "/api/accounts", cookie=cookie)[0]
        assert all(item["id"] != doomed["id"] for item in remaining_accounts)
        successor_overview = next(item for item in remaining_accounts if item["id"] == successor_a["id"])
        assert sum(item["role"] == "Owner" for item in successor_overview["memberships"]) == 2
        for path in group_paths:
            assert all(item["appUserId"] != doomed["id"] for item in api("GET", path + "/members", cookie=successor_a_cookie if path != group_paths[1] else successor_b_cookie)[0])
        print("OK: sysadmin membership overview, deletion plans, eligible successors, stale plan rollback, atomic multi-group replacement, revoked sessions and preserved history")
        # Self deletion is allowed only with another active system administrator.
        api("PUT", "/api/accounts/" + self_deleting["id"] + "/permissions", {"isSysAdmin": True, "canCreateGroups": True}, cookie, 204)
        api("DELETE", "/api/accounts/" + self_deleting["id"], {"ownershipTransfers": []}, self_deleting_cookie, 204)
        api("GET", "/api/auth/me", cookie=self_deleting_cookie, expected=401)
        first_admin, first_admin_cookie = new_account("delete-admin-one")
        second_admin, second_admin_cookie = new_account("delete-admin-two")
        for user in [first_admin, second_admin]:
            api("PUT", "/api/accounts/" + user["id"] + "/permissions", {"isSysAdmin": True, "canCreateGroups": True}, cookie, 204)
        api("PUT", owner_permissions, {"isSysAdmin": False, "canCreateGroups": True}, cookie, 204)
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(lambda entry: request("DELETE", "/api/accounts/" + entry[0]["id"], {"ownershipTransfers": []}, entry[1])[0], [(first_admin, first_admin_cookie), (second_admin, second_admin_cookie)]))
        assert sorted(outcomes) == [204, 400], outcomes
        survivor, survivor_cookie = (first_admin, first_admin_cookie) if outcomes[0] == 400 else (second_admin, second_admin_cookie)
        assert api("GET", "/api/accounts/" + survivor["id"] + "/deletion", cookie=survivor_cookie)[0]["isLastSystemAdministrator"]
        api("PUT", owner_permissions, {"isSysAdmin": True, "canCreateGroups": True}, survivor_cookie, 204)
        api("DELETE", "/api/accounts/" + survivor["id"], {"ownershipTransfers": []}, cookie, 204)
        print("OK: self deletion revokes authentication and simultaneous administrator deletions preserve the last active administrator")

        with ThreadPoolExecutor(max_workers=20) as pool:
            results = list(pool.map(lambda _: request("GET", group_path, cookie=cookie)[0], range(20)))
        assert results == [200] * 20
        for _ in range(300):
            status, headers, _ = request("GET", "/api/auth/registration")
            if status == 429:
                assert "retry-after" in headers
                break
        else:
            raise AssertionError("Authentication rate limit was not enforced")
        print("OK: excessive authentication requests receive 429 with Retry-After")
        for _ in range(25):
            status, headers, _ = request("POST", group_path + "/invitations", {"role": "Member"}, cookie)
            if status == 429:
                assert 0 < int(headers["retry-after"]) <= 3600
                break
            assert status == 200
        else:
            raise AssertionError("Invitation creation limit was not enforced")
        print("OK: invitation creation is limited per user across groups")
        # Simulate the legacy status data before the repair migration, only in this isolated DB.
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c",
               "UPDATE \"AspNetUsers\" SET \"Status\" = '' WHERE \"Email\" = 'outsider@example.test'; "
               "UPDATE \"AspNetUsers\" SET \"Status\" = 'Disabled' WHERE \"Email\" = 'locked@example.test'; "
               "DELETE FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" LIKE '%_NormalizeLegacyAccountStatus';")
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c",
               "UPDATE \"AspNetUsers\" SET \"Email\" = 'kristofer.hoglind@gmail.com', \"NormalizedEmail\" = 'KRISTOFER.HOGLIND@GMAIL.COM' WHERE \"Email\" = 'admin@example.test'; "
               "DELETE FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" LIKE '%_GrantProductionSystemAdministrator';")
        # Simulate an older database that permitted duplicate owners and owner invitations.
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-v", "ON_ERROR_STOP=1", "-c",
               'DROP INDEX "IX_SportsGroupMembers_SportsGroupId"; '
               + 'UPDATE "SportsGroupMembers" SET "Role" = \'Owner\' WHERE "Id" IN (\'' + admin_target["id"] + "','" + member_target["id"] + "'); "
               + 'UPDATE "GroupInvitations" SET "Role" = \'Owner\', "RevokedAt" = NULL WHERE "Id" = \'' + admin_link["invitation"]["id"] + "'; "
               + 'DELETE FROM "__EFMigrationsHistory" WHERE "MigrationId" LIKE \'%_EnforceSingleGroupOwner\';')
        # Simulate the old column default: the migration must change defaults, not existing grants.
        docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-c",
               'ALTER TABLE "AspNetUsers" ALTER COLUMN "CanCreateGroups" SET DEFAULT TRUE; '
               + 'DELETE FROM "__EFMigrationsHistory" WHERE "MigrationId" LIKE \'%_DefaultGroupCreationPermissionOff\';')
        # Recreate rather than restart, to prove no key files from the old
        # container are required. Docker may assign a different local port.
        docker("rm", "-f", "-v", app)
        port = start_app()
        wait_ready()
        legacy = docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-Atc",
                        "SELECT \"Status\" FROM \"AspNetUsers\" WHERE \"Email\" IN ('outsider@example.test', 'locked@example.test') ORDER BY \"Email\";")
        assert legacy.splitlines() == ["Disabled", "Active"], legacy
        print("OK: legacy empty statuses repaired without enabling disabled accounts")
        provisioned = docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-Atc",
                             "SELECT \"IsSysAdmin\" FROM \"AspNetUsers\" WHERE \"NormalizedEmail\" = 'KRISTOFER.HOGLIND@GMAIL.COM';")
        assert provisioned == "t", provisioned
        print("OK: existing production operator is promoted without removing other administrators")
        api("PUT", account_path, {"isSysAdmin": False, "canCreateGroups": True}, cookie, 204)
        repaired_members = api("GET", group_path + "/members", cookie=cookie)[0]
        assert [row["id"] for row in repaired_members if row["role"] == "Owner" and row["status"] == "Approved"] == [owner_member["id"]]
        assert all(row["role"] == "Admin" for row in repaired_members if row["id"] in [admin_target["id"], member_target["id"]])
        repaired_invitation = docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-Atc", 'SELECT "RevokedAt" IS NOT NULL FROM "GroupInvitations" WHERE "Id" = \'' + admin_link["invitation"]["id"] + "';")
        assert repaired_invitation == "t", repaired_invitation
        print("OK: upgrade preserves earliest owner, demotes duplicate owners and revokes legacy owner invitations")
        preserved_grants = docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-Atc",
                                  'SELECT "CanCreateGroups" FROM "AspNetUsers" WHERE "Email" IN (\'owner@example.test\', \'locked@example.test\') ORDER BY "Email";')
        assert preserved_grants.splitlines() == ["f", "t"], preserved_grants
        print("OK: group creation default is off and existing explicit permissions survive migration")
        actual, _ = api("GET", "/api/auth/me", cookie=cookie)
        assert actual["id"] == owner["id"], "Login did not survive a fresh container"
        assert api("GET", group_path, cookie=cookie)[0]["id"] == group["id"]
        print("OK: 20 parallel reads, persisted group data and original login survives a fresh container")
        docker("run", "--rm", "--network", network,
               "-e", "ConnectionStrings__DefaultConnection=Host=" + db + ";Database=hallen_test;Username=hallen;Password=" + password,
               args.image, "--migrate-only")
        still_revoked = docker("exec", db, "psql", "-U", "hallen", "-d", "hallen_test", "-Atc",
                               "SELECT \"IsSysAdmin\" FROM \"AspNetUsers\" WHERE \"NormalizedEmail\" = 'KRISTOFER.HOGLIND@GMAIL.COM';")
        assert still_revoked == "f", still_revoked
        print("OK: standalone migration exits successfully and does not regrant revoked operator permissions")
        docker("rm", "-f", "-v", app)
        port = start_app(environment="Development")
        wait_ready()
        _, development_headers = api("POST", "/api/auth/login", {"email": "owner@example.test", "password": "Smoke-test-12345"})
        development_cookie = development_headers["set-cookie"]
        assert development_cookie.startswith("Hallen.Dev.Auth=")
        assert "secure" not in development_cookie.lower() and "httponly" in development_cookie.lower()
        assert "samesite=lax" in development_cookie.lower()
        development_cookie = development_cookie.split(";", 1)[0]
        assert api("GET", "/api/auth/me", cookie=development_cookie)[0]["id"] == owner["id"]
        assert api("GET", "/api/sports-groups", cookie=development_cookie)[0]
        print("OK: development cookie supports same-origin HTTP and authenticated group requests")

    except Exception:
        if port is not None:
            logs = subprocess.run(["docker", "logs", "--tail", "35", app], capture_output=True, text=True)
            print((logs.stdout + logs.stderr).replace(password, "[test password]"))
        raise
    finally:
        for name in (app, db):
            subprocess.run(["docker", "rm", "-f", "-v", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["docker", "network", "rm", network], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
