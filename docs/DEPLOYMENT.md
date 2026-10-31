# Hallen på Render + Supabase

React och ASP.NET Core körs i samma container och på samma HTTPS-adress. Webbläsaren
anropar `/api/...`. Bara API-servern ansluter till Supabase PostgreSQL. Hallens
befintliga användarkonton, grupper och behörigheter behålls; Supabase Auth används
inte. En ny databas startar tom, utan de lokala utvecklingsuppgifterna.

## 1. Skapa Supabase-projektet

1. Skapa ett separat projekt för demon, gärna i en europeisk region nära Frankfurt.
2. Spara databaslösenordet i din lösenordshanterare.
3. **Stäng av Data API** under projektets Data API-inställningar innan du migrerar.
   Vi ansluter via PostgreSQL och använder inte Supabases REST/GraphQL-API.
   Hallens Identity-tabeller och Data Protection-nycklar får inte exponeras där.
4. Välj **Connect → Session pooler**, port **5432**. Kopiera exakt värdnamn och
   användarnamn. Session pooler fungerar över IPv4 även på gratisplanen.
   Använd inte transaction pooler på port 6543 för detta upplägg.
5. Sätt ihop en Npgsql-anslutningssträng enligt `.env.example`:

   ```text
   Host=YOUR-POOLER-HOST;Port=5432;Database=postgres;Username=postgres.YOUR-PROJECT-REF;Password=YOUR-DATABASE-PASSWORD;SSL Mode=VerifyFull;Maximum Pool Size=10;Timeout=15
   ```

   Det här är en databasanslutningssträng, **inte** Supabase Project URL eller en
   anon/service-role-nyckel. Lösenord med semikolon eller citattecken måste citeras
   enligt Npgsql-formatet. `VerifyFull` kontrollerar servercertifikatet.
   Dockerpaketet installerar Supabases offentliga rotcertifikat från
   `deploy/certificates/supabase-root-2021.crt` i systemets certifikatlager.
   Behåll `SSL Mode=VerifyFull`; ingen `Trust Server Certificate`-inställning behövs.
   Stäng inte av certifikatvalideringen.

Källor: [Supabase-anslutningar](https://supabase.com/docs/guides/database/connecting-to-postgres),
[Data API-säkerhet](https://supabase.com/docs/guides/api/securing-your-api).

## 2. Lägg koden i ditt Git-repo

Alla filer, inklusive EF-migrationerna, behöver vara incheckade och pushade till
ett repo som Render kan läsa. Granska ändringarna och publicera dem från din
vanliga Git-rutin. Lägg aldrig databaslösenord eller riktiga `.env`-filer i Git.

`.dockerignore` utesluter lokala inställningar, miljöfiler, certifikat och byggfiler.
Dockerbygget använder endast produktionsinställningar och får anslutningssträngen
vid körning. Alla `VITE_*`-värden hamnar i webbläsaren och ska vara offentliga.

## 3. Skapa Render-tjänsten

### Via Blueprint

Välj **New → Blueprint**, koppla repot och använd `render.yaml`. Fyll i det hemliga
värdet för `ConnectionStrings__DefaultConnection` i Render. Blueprinten väljer
**Free** och Frankfurt för demon. Automatiska deployer är avstängda från början.

### Alternativt manuellt

Välj **New → Web Service**, koppla repot och välj:

| Inställning | Värde |
| --- | --- |
| Language/runtime | Docker |
| Root directory | Lämnas tom, använd hela repot |
| Dockerfile | `./Dockerfile` |
| Region | Frankfurt |
| Instance | Free för demo |
| Health check path | `/healthz` |

Ange följande under Environment:

| Namn | Värde |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_HTTP_PORTS` | `10000` |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | `true` |
| `Database__MigrateOnStartup` | `true` |
| `ConnectionStrings__DefaultConnection` | Din hemliga Npgsql-sträng |

Den externa HTTPS-adressen avslutas i Renders proxy. Forwarded headers är därför
aktiverade **för denna miljö bakom Renders proxy**. Exponera inte containerns
HTTP-port direkt på internet med den inställningen. Med en egen proxy behöver
betrodda proxyadresser konfigureras för den miljön.

Ingen frontend-URL eller Supabase-nyckel behövs i React. Appen använder samma origin
för gränssnitt och API, vilket gör att cookies fungerar även på mobil.

Källor: [Render Docker](https://render.com/docs/docker),
[Blueprint](https://render.com/docs/blueprint-spec),
[proxyhantering i ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer).

## 4. Första starten

1. Starten applicerar alla EF-migrationer och skapar tabeller i den nya databasen.
   Vid fel stoppas starten, så att Render inte skickar användare till ett API med
   fel databasversion. Starta bara **en instans** när startup-migrering är på.
2. Öppna Render-adressen och registrera ditt eget Hallen-konto innan du delar
   länken. Det första registrerade kontot markeras som systemadministratör enligt
   appens befintliga logik. Render-/Supabase-konton är separata från Hallen-kontot.
3. Skapa en spelargrupp, lägg in spelare och skapa en spelsession.
4. Kontrollera att lag, matcher och resultat kan sparas. Lägg till en medlem och
   kontrollera att medlemskontot bara får de behörigheter gruppen ger det.
5. Prova en omstart/deploy: data och inloggning ska finnas kvar.

Inloggningsnycklarna lagras i databasens `DataProtectionKeys`, eftersom Renders
lokala filsystem är tillfälligt. Ta inte bort nycklarna vid deploy. Nyckelmaterialet
är känsligt och skyddas av samma databasåtkomst som övriga interna tabeller.

`/healthz` är en lätt livssignal utan databasfråga. `/readyz` kontrollerar
anslutningen till databasen vid behov. Swagger är bara tillgängligt i Development.

## Migreringar vid senare produktionssättning

För en enda demo-instans kan `Database__MigrateOnStartup=true` användas. När du
byter till betald Render-server kan du i stället ange:

```text
Pre-deploy command: dotnet Hallen.Api.dll --migrate-only
Database__MigrateOnStartup=false
```

Pre-deploy-kommandot kräver ett Render-abonnemang som stöder funktionen. Då körs
migreringen separat före den nya serverversionen. Använd bakåtkompatibla migreringar
när gamla och nya versionen kan vara igång samtidigt. Ta backup innan
schemaändringar. Att återställa serverversionen återställer inte databasschemat.

## Domän och produktionsdrift

- När en egen domän läggs till: sätt `AllowedHosts` till tillåtna värdnamn,
  semikolonseparerade, utan `https://`. Render-värdnamnet används automatiskt om
  ingen egen lista anges. Uppdatera listan innan trafik skickas till en ny domän.
- Betald Render-server behövs för att slippa gratisnivåns viloläge. Välj server
  efter uppmätt minnesanvändning; 10–20 användare är en startpunkt, inte ett lasttest.
- Supabase Free kan pausas vid låg aktivitet. Ordna schemalagda säkerhetskopior och
  testa återläsning; Pro har dagliga backuper. Använd separat projekt/databas för
  demo och produktion om demon ska kunna återställas.
- Runtime är projektets befintliga .NET 8. Uppgradera till en fortsatt supportad
  .NET-version inför långvarig produktionsdrift; .NET 8 når supportslut i november
  2026. Dockerfilens SDK- och runtime-versioner ska ändras tillsammans med projektet.
  Se [Microsofts supportpolicy](https://dotnet.microsoft.com/en-us/platform/support/policy).

## Lokal verifiering av Dockerpaketet

```bash
docker build -t hallen:demo .
python3 scripts/smoke-deployment.py --image hallen:demo
```

Testet startar en isolerad tillfällig PostgreSQL och servercontainer, kör
migreringarna och kontrollerar sidladdning, cookies efter omstart och lagbehörigheter.
Det ansluter aldrig till din lokala eller riktiga Supabase-databas och tar bort
sina egna testcontainrar efteråt.

Vanlig lokal utveckling fungerar som tidigare med `docker compose up -d` och
`npm run dev`. Frontend använder då `https://localhost:7251`. För en annan lokal
API-adress kan `VITE_API_BASE_URL` sättas i en lokal frontend-miljöfil.

## Felsökning: SSL handshake / remote certificate rejected

Poolern kan presentera en kedja signerad av **Supabase Root 2021 CA**, som inte
finns i Debians vanliga CA-bunt. Dockerfilen installerar den publika rot-CA:n
innan processen byter till användaren `app`. Vid detta fel ska du verifiera att
den senaste Dockerfilen och `deploy/certificates/supabase-root-2021.crt` finns i
den commit som Render bygger. Deploya sedan om. Behåll `SSL Mode=VerifyFull`.

Detta är separat från appens HTTPS-certifikat som Render sköter. Certifikatet i
repot är offentligt och innehåller ingen privat nyckel eller något lösenord.
Se [certifikatets dokumentation](../deploy/certificates/README.md).
