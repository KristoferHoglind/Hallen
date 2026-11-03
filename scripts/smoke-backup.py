#!/usr/bin/env python3
"""Test encrypted backup/restore using disposable Docker databases and keys only."""
import os
from pathlib import Path
import secrets
import subprocess
import tempfile
import time
import uuid


def run(*args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, **kwargs)


def main():
    suffix=uuid.uuid4().hex[:10]
    network="hallen-backup-test-"+suffix
    db=network+"-db"
    password=secrets.token_hex(24)
    def docker(*args):
        result=run("docker",*args)
        if result.returncode: raise RuntimeError(result.stderr.replace(password,"[test password]"))
        return result.stdout.strip()
    try:
        docker("network","create",network)
        docker("run","-d","--name",db,"--network",network,"-e","POSTGRES_PASSWORD="+password,"postgres:17")
        for _ in range(60):
            if run("docker","exec",db,"pg_isready","-h","127.0.0.1","-U","postgres").returncode==0: break
            time.sleep(.5)
        else: raise RuntimeError("Test database not ready")
        for name in ("backup_source","backup_restore","backup_corrupt"):
            docker("exec",db,"createdb","-U","postgres",name)
        docker("exec",db,"psql","-U","postgres","-d","backup_source","-c","CREATE TABLE example_matches (id int PRIMARY KEY, name text); INSERT INTO example_matches VALUES (1,'Ada and Bea'),(2,'Cleo and Dee'); CREATE TABLE example_payload(id int PRIMARY KEY,payload text); INSERT INTO example_payload SELECT i,md5(random()::text)||md5(random()::text) FROM generate_series(1,10000) i;")
        with tempfile.TemporaryDirectory(prefix="hallen-encrypted-backup-") as tmp:
            recipient=""
            def tool(*args,database="backup_source",confirm=False):
                return run("docker","run","--rm","--network",network,"--user",f"{os.getuid()}:{os.getgid()}",
                    "-v",str(Path(tmp).resolve())+":/backups","-v",str(Path('scripts').resolve())+":/scripts:ro",
                    "-e","PGHOST="+db,"-e","PGUSER=postgres","-e","PGPASSWORD="+password,"-e","PGDATABASE="+database,
                    "-e","PGSSLMODE=disable","-e","BACKUP_DIRECTORY=/backups","-e","BACKUP_RECIPIENT="+recipient,
                    "-e","BACKUP_IDENTITY_FILE=/backups/key.txt","-e","HALLEN_RESTORE_CONFIRM="+("empty-test-database" if confirm else ""),
                    "hallen:backup",*args)
            keygen=tool("-c","age-keygen -o /backups/key.txt >/dev/null 2>&1 && age-keygen -y /backups/key.txt")
            assert keygen.returncode==0,keygen.stderr
            recipient=keygen.stdout.strip()
            backup=tool("/scripts/backup-database.sh")
            assert backup.returncode==0,backup.stderr
            files=list(Path(tmp).glob("*.dump.age"));assert len(files)==1 and len(files[0].read_bytes())>65536
            assert not list(Path(tmp).glob("*.dump")) and not list(Path(tmp).glob(".hallen-backup.*"))
            assert b'Ada and Bea' not in files[0].read_bytes()
            restored=tool("/scripts/restore-backup.sh","/backups/"+files[0].name,database="backup_restore",confirm=True)
            assert restored.returncode==0,restored.stderr
            assert docker("exec",db,"psql","-U","postgres","-d","backup_restore","-Atc","SELECT string_agg(name,', ' ORDER BY id) FROM example_matches;")=="Ada and Bea, Cleo and Dee"
            assert docker("exec",db,"psql","-U","postgres","-d","backup_restore","-Atc","SELECT count(*) FROM example_payload;")=="10000"
            assert tool("/scripts/restore-backup.sh","/backups/"+files[0].name,database="backup_restore",confirm=True).returncode!=0
            assert tool("/scripts/restore-backup.sh","/backups/"+files[0].name,database="backup_corrupt").returncode!=0
            raw=files[0].read_bytes();Path(tmp,"corrupt.dump.age").write_bytes(raw[:len(raw)//2])
            assert tool("/scripts/restore-backup.sh","/backups/corrupt.dump.age",database="backup_corrupt",confirm=True).returncode!=0
            assert docker("exec",db,"psql","-U","postgres","-d","backup_corrupt","-Atc","SELECT count(*) FROM pg_tables WHERE schemaname='public';")=="0"
            print("OK: encrypted backup, no plaintext file, real restore with exact data, non-empty/unchecked target refusal and corrupt backup rollback")
    finally:
        run("docker","rm","-f","-v",db)
        run("docker","network","rm",network)


if __name__=="__main__":main()
