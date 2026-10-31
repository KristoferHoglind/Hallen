#!/usr/bin/env python3
"""Exercise the production image against a disposable PostgreSQL database.

Requires Docker and Python 3. No application credentials or existing databases
are used. All containers and the network created here are removed on exit.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import http.client
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
        return json.loads(body) if body else None, headers

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

        def start_app():
            docker("run", "-d", "--name", app, "--network", network, "--memory", "512m",
                   "-p", "127.0.0.1::10000",
                   "-e", "ConnectionStrings__DefaultConnection=Host=" + db + ";Database=hallen_test;Username=hallen;Password=" + password + ";Maximum Pool Size=10",
                   "-e", "Database__MigrateOnStartup=true",
                   "-e", "ASPNETCORE_FORWARDEDHEADERS_ENABLED=true", args.image)
            return int(docker("port", app, "10000/tcp").rsplit(":", 1)[1])

        port = start_app()
        wait_ready()
        assert request("GET", "/healthz", proxy=False)[0] == 200
        assert request("GET", "/api/auth/me", proxy=False)[0] in (307, 308)
        for path in ("/", "/spela", "/grupper", "/medlemmar"):
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

        def register(label):
            user, headers = api("POST", "/api/auth/register", {
                "email": label + "@example.test", "displayName": label, "password": "Smoke-test-12345"})
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
        _, outsider_cookie = register("outsider")
        status, _, _ = request("PUT", team_path, {"name": "Not allowed"}, outsider_cookie)
        assert status in (400, 403, 404), "Non-member renamed another group's team"
        api("PUT", team_path, {"name": "Renamed team"}, cookie)
        setup, _ = api("POST", session_path + "/players/reset", cookie=cookie)
        assert all(not p["isAssignedToTeam"] for p in setup["participants"])
        assert all(not team["players"] for team in setup["teams"])
        print("OK: production cookies, group/player/session creation, team permissions and player reset")

        with ThreadPoolExecutor(max_workers=20) as pool:
            results = list(pool.map(lambda _: request("GET", group_path, cookie=cookie)[0], range(20)))
        assert results == [200] * 20
        # Recreate rather than restart, to prove no key files from the old
        # container are required. Docker may assign a different local port.
        docker("rm", "-f", "-v", app)
        port = start_app()
        wait_ready()
        actual, _ = api("GET", "/api/auth/me", cookie=cookie)
        assert actual["id"] == owner["id"], "Login did not survive a fresh container"
        assert api("GET", group_path, cookie=cookie)[0]["id"] == group["id"]
        print("OK: 20 parallel reads, persisted group data and original login survives a fresh container")
        docker("run", "--rm", "--network", network,
               "-e", "ConnectionStrings__DefaultConnection=Host=" + db + ";Database=hallen_test;Username=hallen;Password=" + password,
               args.image, "--migrate-only")
        print("OK: standalone migration command exits successfully on an up-to-date database")
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
