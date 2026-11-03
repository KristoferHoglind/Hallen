# Säkerhet i Hallen

## I koden

- .NET/ASP.NET Core/EF Core 10 LTS och Npgsql 10. Lokal utveckling kräver .NET 10 SDK.
  `global.json` väljer aktuell stabil .NET 10-featureversion. Kör `dotnet tool restore`
  för det versionslåsta EF-verktyget. Docker innehåller rätt SDK/runtime.
- Alla skrivande MVC-API-anrop kräver ASP.NET:s antiforgery-token och cookie, även
  inloggning, registrering, lösenordsåterställning och 2FA. React-klienten hämtar
  token från `/api/security/csrf`. Efter identitetsbyte hämtas en ny token.
  Avvisade skrivningar återförs inte automatiskt. API-klienter/tester måste också
  skicka `X-Hallen-CSRF` samt cookies från token-anropet.
- Produktion skickar CSP, Permissions-Policy, HSTS, frame-skydd och no-sniff.
  Inline-stilar tillåts eftersom React Bootstrap använder dem; inline-skript och
  externa skript tillåts inte. Blob-bilder tillåts för PNG-exporten.
- Säkerhetsmigrationen aktiverar RLS och återkallar tabellrättigheter från PUBLIC,
  `anon` och `authenticated` för Hallens tabeller, inklusive Identity, inbjudningar,
  Data Protection och migrationshistorik. Publika standardrättigheter återkallas
  för den migrerande databasrollen. Ändringen återöppnar inte åtkomst vid rollback.
- Säkerhetsloggen registrerar aktörens ID, entitetens ID, UTC-tid, åtgärd och
  ändrade fältnamn för administrativa ändringar. Inga fältvärden, lösenord,
  autentiseringsnycklar, återställningskoder eller begärandekroppar sparas.
  Loggposten skrivs i samma SaveChanges/transaction som ändringen. Befintliga
  historiska ändringar fylls inte på i efterhand. Systemadmin läser loggen under
  Konton och lösenord. Loggen är inte ett kryptografiskt manipulationsbevis.

## Gör i Supabase/Render före produktionssättning

1. Ta en backup och prova återläsningen i en separat tom databas.
2. Byt databaslösenordet som tidigare delades i chatten. Gör det i Supabase och
   uppdatera de anslutningssträngar som använder det. Spara endast i
   lösenordshanterare/Render/GitHub Secrets. Koden byter aldrig ett lösenord i
   produktion eller skriver ut det. Planera ett kort omstartstillfälle.
3. Stäng av Supabase Data API om det inte redan är gjort. Hallen använder direkt
   PostgreSQL, inte Supabase Auth/REST/GraphQL. Migrationens skydd kompletterar
   detta; inställningen och eventuella egna RPC-funktioner måste också granskas.
4. Behåll `SSL Mode=VerifyFull`. Tillåt inte `Trust Server Certificate=true`.
5. Rekommenderat: kör `deploy/security/runtime-role.sql` med databasägaren och sätt
   ett nytt unikt lösenord för `hallen_runtime` via `psql`-kommandot
   `\password hallen_runtime` (lösenordet hamnar inte i SQL-filen/historiken).
   Via session pooler blir användarnamnet normalt `hallen_runtime.PROJECT_REF`;
   kontrollera anslutningsdetaljerna för projektet. Skriptet antar databasen
   `postgres`; anpassa CONNECT-raden om du använder en annan databas.
6. Kör schemaändringar med ägarkontot **utanför webbprocessen**, till exempel
   workflowen `Migrate production database` via GitHub Actions med hemligheten
   `MIGRATION_CONNECTION_STRING` och miljön `production`. Välj rätt releasegren
   och konfigurera gärna krav på manuell miljögranskning i GitHub.
7. Render får då `ConnectionStrings__DefaultConnection` med runtime-kontot och
   `Database__MigrateOnStartup=false`. Ge inte webbprocessen ägarkontots hemlighet.
   Runtime-rollen får SELECT/INSERT/UPDATE/DELETE på Hallens tabeller och
   RLS-policyer för dessa; audit-loggen får bara SELECT/INSERT. Ingen DDL-rättighet.
   Säkerhetsmigrationen tilldelar policyer/rättigheter om rollen redan finns.
   För framtida tabeller ska nya migrationer uttryckligen ta ställning till RLS,
   publika grants och runtime-rättigheter.

För enklare övergång finns `ConnectionStrings__MigrationConnection`: om
`MigrateOnStartup=true` kan den användas för migrering medan DefaultConnection
används under vanlig körning. Ägarlösenordet finns då fortfarande i processens
miljö och ger **inte samma isolering** som en separat migrationskörning. Utan
MigrationConnection används DefaultConnection, vilket bevarar befintlig drift
vid den första säkerhetsdeployen.

## Tvåfaktorsinloggning

Alla konton kan aktivera en autentiseringsapp under **Kontosäkerhet**. Börja med
systemadministratörerna. Befintliga konton tvångsaktiveras inte vid migrering.

1. Ange aktuellt lösenord och lägg in den hemliga nyckeln manuellt i valfri
   kompatibel TOTP-app (sex siffror, 30 sekunder).
2. Bekräfta med appens kod. Nyckeln och koderna ska inte skickas till andra.
3. Spara de tio engångs-återställningskoderna i din lösenordshanterare; de visas
   bara vid aktivering.
4. Vid nästa inloggning krävs även appkod eller en återställningskod. Förlorad
   app kan ersättas genom att logga in med en återställningskod och inom fem
   minuter stänga av 2FA med lösenordet och sedan konfigurera en ny app.
5. Aktivering/avstängning återkallar andra sessioner. Inställningarna kräver
   lösenord och är anropsbegränsade. Två samtidiga anrop kan inte återanvända
   samma återställningskod. Pågående 2FA-inloggning är giltig i fem minuter och
   ogiltigförklaras om lösenord/säkerhetsstämpel ändrats.

Lösenordsåterställning stänger inte av tvåfaktorsinloggning. Om både app och
samtliga återställningskoder saknas krävs identifiering av ägaren och en separat,
kontrollerad operatörsåtgärd. Det finns ingen publik endpoint för att kringgå 2FA.

## Krypterad backup

`backup-database.sh` strömmar en PostgreSQL custom dump direkt genom `age`.
Ingen okrypterad dumpfil skapas. Backuper innehåller personuppgifter och
säkerhetsnycklar och ska behandlas som hemliga även när de är krypterade.

1. Generera ett age-nyckelpar med `age-keygen` på en betrodd dator. Förvara den
   privata identiteten separat från både GitHub och databasen, exempelvis i
   lösenordshanteraren. Den behövs för återläsning. Lägg aldrig nyckeln i repot.
2. Lägg dessa GitHub Actions Secrets i repot:
   `BACKUP_PGHOST`, `BACKUP_PGUSER`, `BACKUP_PGPASSWORD`, `BACKUP_AGE_RECIPIENT`.
   Recipient är den **publika** age-nyckeln, inte den privata identiteten.
3. Kör `Encrypted database backup` manuellt och kontrollera den krypterade
   artefakten. När workflowen ligger på standardgrenen körs den dagligen 02:30
   UTC (03:30 svensk vintertid, 04:30 sommartid). Artefakter behålls i 30 dagar.
4. Övervaka misslyckade workflowkörningar. GitHub Actions är inte en garanti för
   exakt körtid. Testa återläsning regelbundet och förvara viktiga långtidskopior
   separat. PostgreSQL-klienten i verktygsbilden är version 17; uppdatera bilden
   när servern uppgraderas till en nyare huvudversion.

Lokalt används libpq:s vanliga `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` eller
`PGSERVICE`/`PGPASSFILE`, samt `PGDATABASE`, `PGSSLMODE=verify-full` och
`PGSSLROOTCERT`. Skicka aldrig lösenord i kommandoraden. Ange dessutom
`BACKUP_RECIPIENT` och vid behov `BACKUP_DIRECTORY` innan du kör skriptet.

Återläs endast till en separat **tom testdatabas**, aldrig den live-databas som
användarna arbetar i. Kör `restore-backup.sh encrypted.dump.age` med
`BACKUP_IDENTITY_FILE` och `HALLEN_RESTORE_CONFIRM=empty-test-database`.
Skriptet vägrar skriva till en databas som redan har tabeller och återläser i en
enda transaktion. Om dumpen innehåller policyer för `hallen_runtime` behöver den
rollen skapas i testservern före återläsning. Verifiera därefter inloggning,
grupper och matcher med en separat testinstans av Hallen. Storage-filer och
Supabases egna auth-scheman omfattas inte; Hallen använder dem inte.

## Automatiska kontroller

`security.yml` kör npm audit (stoppar vid high/critical) och NuGet-audit även för
transitiva beroenden, vid push/PR och varje vecka. Dependabot föreslår
uppdateringar för npm, NuGet, Docker och Actions. Actions är versionslåsta med
commit-ID och har bara läsrättighet till repot. Säkerhetskontrollerna kräver inga
produktionshemligheter. Aktivera gärna branch protection för att kräva godkända
kontroller före merge.

Efter uppdatering: kör frontend lint/build, `scripts/smoke-deployment.py` och
`scripts/smoke-backup.py` mot de byggda bilderna `hallen:demo` respektive
`hallen:backup`. Testerna skapar och städar endast tillfälliga Dockerresurser.

### Kvarvarande utvecklingsberoenden

Vid kontrollen 3 november 2026 rapporterar npm audit inga sårbarheter i
produktionsberoendena och inga high/critical i hela trädet efter kompatibla
uppdateringar. Det finns fortfarande low/moderate-varningar i transitiva
utvecklingsverktyg (bland annat workbox/glob/minimatch/deepmerge). Inga
inkompatibla tvångsnedgraderingar har gjorts för att dölja dessa. De bevakas av
veckokontrollen och Dependabot; bygg endast med betrodda källfiler.
