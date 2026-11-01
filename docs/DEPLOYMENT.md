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
2. Befintliga Hallen-konton fungerar som tidigare. Öppen registrering är stängd:
   nya konton behöver en engångsinbjudan. Om databasen är helt tom måste du för den
   första uppsättningen tillfälligt sätta `Registration__AllowBootstrap=true` i
   Render, deploya och registrera ditt eget konto innan länken delas. Den möjligheten
   fungerar bara medan databasen saknar användare. Sätt sedan värdet till `false`.
   Render-/Supabase-konton är separata från Hallen-kontot.
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

## Inbjudningar och registrering

Nya konton kräver en inbjudningslänk. Befintliga användare och deras grupper ändras
inte vid uppgraderingen. Lämna `Registration__AllowBootstrap=false` för den liveapp
som redan har användare. Den nya EF-migrationen appliceras vid nästa deploy enligt
samma inställningar som övriga migrationer.

Under **Grupper → vald grupp → Medlemmar och behörigheter** kan ägare skapa länkar till sin grupp. Admins
kan bjuda in medlemmar; bara ägare kan erbjuda adminrollen. Ägarrollen kan bara överföras till en befintlig godkänd medlem. En länk gäller i
72 timmar och får användas en gång, även när två registreringar försöker använda
den samtidigt. Kontot och medlemskapet skapas i samma databastransaktion.

Länken är en bearer-inbjudan: den som får tillgång till den kan använda den och
välja sin e-postadress. Dela därför en separat länk med varje person. Den är inte
bunden till en viss e-postadress och verifierar inte ägarskap av e-postkontot.
En befintlig användare kan logga in och acceptera länken i stället för att skapa
ett nytt konto. Befintliga eller tidigare medlemskap ändras inte av en inbjudan;
de hanteras av gruppägaren. Nya konton via gruppinbjudan får inte skapa egna grupper. Inbjudningar via
**Konton och lösenord** ger den rätten; systemadministratörer kan även tilldela
den separat i kontohanteringen.

Token genereras kryptografiskt, lagras endast som SHA-256-hash och visas i klartext
bara när länken skapas. Länkens token ligger i URL-fragmentet (`#...`), som inte
skickas till webbservern. Preview och acceptans skickar token i POST-kroppen. Logga
inte request bodies för dessa anrop. Länkar kan återkallas från samma medlemsvy;
de slutar även fungera om utfärdaren inte längre har rätt att bjuda in den rollen.

Försöksbegränsning:

- Autentiseringsanrop och inbjudningskontroll: 60 anrop/minut per klient-IP.
- Skapa inbjudan: 20 länkar/timme per inloggad användare, över alla grupper.
- Överskridande ger HTTP 429 och `Retry-After`. Gränserna kan anpassas med
  `RateLimiting__AuthPermitLimit` och `RateLimiting__InvitationPermitLimit`.
- Fem felaktiga lösenord spärrar kontot i tio minuter.

Rate limitern ligger i serverprocessens minne. Den räknas om vid omstart och delas
inte mellan flera instanser; vid skalning behövs ett gemensamt eller externt skydd.
Försöksbegränsning är inte ett fullständigt DDoS-skydd. IP-adresserna förutsätter
korrekt proxykonfiguration enligt avsnittet om Render ovan.

### Återställning av lösenord

En gruppägare eller admin öppnar **Grupper → vald grupp → Medlemmar och behörigheter**, väljer kontot, skapar
en återställningslänk och kopierar den. Dela länken direkt med kontots ägare efter
att ha kontrollerat vem personen är. Ägare kan hjälpa godkända medlemmar i sin grupp; admin kan bara hjälpa
vanliga medlemmar. Inaktiva konton och systemadministratörskonton kan inte
återställas via gruppen. En systemadministratör kan även använda knappen **Återställ lösenord** på
respektive kontorad under **Konton och lösenord** för att hjälpa aktiva konton. Återställningen gäller hela kontot, även
om personen ingår i flera grupper. Inga mejl skickas.

Länken gäller i en timme och blir ogiltig efter lyckad återställning. Flera
skapade länkar fungerar fram till dess; en ny länk återkallar inte äldre länkar.
Tidigare inloggningar avvisas vid nästa API-anrop efter återställningen, och
eventuell tillfällig kontolåsning hävs. Återställningsnyckeln ligger i URL-fragmentet
och skickas i anropets body. Identity skyddar token med serverns beständiga
Data Protection-nycklar. Länkar ska aldrig sparas i loggar eller ärenden.

### Kontobehörigheter och systemadministratörer

Under **Konton och lösenord** kan aktiva systemadministratörer ge flera konton
systemadministratörsbehörighet och välja vilka konton som får skapa grupper.
Menyn visas bara för systemadministratörer och API:et kontrollerar den aktuella
behörigheten i databasen vid varje administrationsanrop. Minst en aktiv
systemadministratör måste finnas kvar, även vid samtidiga ändringar.

Befintliga konton behåller sina behörigheter. Nya konton via gruppinbjudan
saknar rätten att skapa grupper, medan kontoinbjudningar från systemadministratörer
ger den rätten. Avstängd rätt att
skapa grupper påverkar inte kontots medlemskap eller befintliga grupper.
Systemadministratörsrollen och rätten att skapa grupper är separata behörigheter.
Ändringar av ett annat kontos behörigheter syns efter omladdning; API:et använder
de nya rättigheterna direkt.

För en redan installerad databas utan systemadministratör: kör följande manuellt
i databasens SQL-konsol med det egna huvudkontots e-postadress. Kontrollera att
exakt rätt konto uppdaterades. Gör detta separat i lokal miljö och produktion;
konton och behörigheter delas inte mellan dessa databaser.

```sql
UPDATE "AspNetUsers"
SET "IsSysAdmin" = TRUE
WHERE "NormalizedEmail" = UPPER('DIN-EPOSTADRESS') AND "Status" = 'Active'
RETURNING "Email", "IsSysAdmin";
```

Vid en helt ny installation blir det första bootstrap-kontot systemadministratör
som tidigare. Fler administratörer utses sedan via sidan.

Migreringen `NormalizeLegacyAccountStatus` sätter tomma statusvärden från äldre
installationer till `Active`. Konton med `Disabled` ändras inte.

För denna Render-installation ger engångsmigreringen
`GrantProductionSystemAdministrator` det befintliga, aktiva kontot
`kristofer.hoglind@gmail.com` systemadministratörsbehörighet. Kontot måste redan
finnas vid migreringen; den skapar inget konto och återaktiverar inga spärrade
konton. Om kontot saknas, använd SQL-instruktionen ovan efter att kontot skapats
via en inbjudan. Andra administratörer behålls. Senare omstarter återställer inte
behörigheter som ändrats via kontohanteringen.

### Inbjudan utan grupp

Systemadministratörer kan välja **Bjud in till Hallen** under **Konton och
lösenord** och kopiera en inbjudningslänk. Den gäller i 72 timmar, används en
gång och kan återkallas från samma dialog. Kontot börjar utan gruppmedlemskap
och utan systemadministratörsbehörighet, men får som standard skapa egna
grupper. En befintlig användare behöver inte använda länken. Gruppinbjudningar
fortsätter att ge medlemskap i den angivna gruppen. Om den som skapade en
Hallen-inbjudan mister sin systemadministratörsbehörighet blir länken ogiltig.

### Gruppinformation och statistik

Ägare och gruppadministratörer kan spara en gruppbeskrivning på högst 2000 tecken
under **Om gruppen**, i Spelöversikt och i gruppadministrationen. Godkända
medlemmar kan läsa texten och gruppstatistiken. Beskrivningen sparas separat
från gruppnamnet.

**Gruppstatistik** räknar färdigspelade, sparade matcher med minst två resultat
från gruppens alla spelsessioner. Den visar totalsiffror, matchrekord och
spelarvinster. Utsedd vinnare gäller även när poängen är lika. Spelarstatistik
använder de sparade matchuppställningarna och grupperar på spelar-id; lag med
samma namn i olika sessioner slås inte ihop. Vinstligan visar alla gruppens spelare, även inaktiva och spelare utan matcher.
Den använder spelarens aktuella namn där det finns, annars det sparade
matchnamnet. Alla kolumner kan sorteras; vinstprocent sorteras utan avrundning. Om resultat redigeras eller tas bort ändras statistiken
när fliken öppnas igen. Ej sparade/ofärdiga matcher räknas inte.

Gruppstatistiken har valfria `fromDate` och `toDate` i formatet `YYYY-MM-DD`.
Filtren gäller spelsessionens startdatum enligt `Europe/Stockholm`, med båda
gränsdagarna inkluderade och hänsyn till sommar-/vintertid. Tomma filter ger
alla sessioner. Hela spelarlistan visas även med datumfilter, men endast
matcherna i valda sessioner räknas i statistiken.

### En gruppägare och överföring

Varje grupp som skapas i appen har en ägare. Ägaren kan inte ändra sin egen roll
eller tas bort som medlem. Under **Grupper → vald grupp → Medlemmar och behörigheter** kan ägaren välja
**Gör till ägare** för en annan godkänd medlem med ett aktivt konto. Efter
bekräftelse blir den medlemmen ägare och den tidigare ägaren administratör, i
samma databastransaktion. Administratörer och medlemmar kan inte överföra
ägarrollen. Vanliga rolländringar och inbjudningar kan inte skapa ägare. Bara den aktuella gruppägaren kan ta bort gruppen; borttagningen låses mot samtidiga ägaröverföringar.

Migreringen `EnforceSingleGroupOwner` lägger till ett unikt index för godkänd
ägarroll per grupp. Om äldre versioner lämnat flera ägare behålls det äldsta
ägar-medlemskapet och övriga blir administratörer (vid samma tid avgör id).
Oanvända äldre ägarinbjudningar återkallas; skapa nya medlems-/admininbjudningar
och överför därefter ägarskapet vid behov. Dessa behörighetsändringar återställs
inte automatiskt om migreringen rullas tillbaka. Äldre grupper utan medlemskap
lämnas orörda; migreringen tilldelar dem inte en godtycklig ägare.

Gruppens medlemsinnehåll är samlat under **Grupper** tillsammans med spelare
och gruppinformation. Godkända medlemmar kan läsa medlemslistan och rollerna;
ägare och administratörer kan ändra Admin/Medlem, bara ägaren kan överföra ägarskap och behöriga ägare/admin
ser inbjudningar och återställning. Den gamla adressen `/medlemmar` omdirigeras
till gruppvyn med medlemsfliken öppen och behåller eventuell gruppparameter.

### Kontoöversikt och borttagning

Under **Konton och lösenord** kan systemadministratörer fälla ut **Grupper** på
varje kontorad för att se gruppnamn, roll och medlemsstatus. **Ta bort konto**
öppnar en bekräftelsedialog som hämtar aktuella ägarskap och möjliga ersättare.
För varje grupp där kontot är godkänd ägare måste en annan aktiv, godkänd
medlem väljas. Namn, e-post och nuvarande grupproll visas i listorna. Saknas
ersättare måste en annan medlem först bjudas in.

API:et kontrollerar alla val igen vid borttagningen. Ägarbyten och borttagning
sker i samma transaktion; felaktiga, saknade eller inaktuella val lämnar kontot
och ägarrollerna orörda. Kontots medlemskap och skapade inbjudningar tas bort,
medan grupper, spelare, matcher och statistik behålls. Godkännandereferenser
till kontot nollställs. Befintliga inloggningar och återställningslänkar kan inte
användas för det borttagna kontot.

Sista aktiva systemadministratören skyddas även vid samtidiga borttagningar
och behörighetsändringar. Eget konto kan tas bort om det finns en annan aktiv
systemadministratör och alla gruppägarskap ersätts; användaren loggas då ut.
Ingen data tas bort bara genom att öppna dialogen.

Registrering sätter `CanCreateGroups` utifrån inbjudningstypen: gruppinbjudan
nekas gruppskapande och Hallen-inbjudan tillåter det. Bootstrap-administratören
får skapa grupper. Migreringen `DefaultGroupCreationPermissionOff` ändrar bara
kolumnens standardvärde till false; den uppdaterar inga befintliga konton. Att
ett befintligt konto accepterar en gruppinbjudan ändrar inte dess behörighet.

Administratörer kan ändra både sin egen roll och andra godkända medlemmars
roller mellan `Admin` och `Member`. Ägarens roll är alltid skyddad. Efter egen
nedgradering till medlem upphör administratörsrättigheterna direkt, och kontot
kan inte uppgradera sig självt igen. Endast ägaren kan överföra ägarskapet och
ta bort gruppen.

Gruppstatistik finns under **Mina grupper → vald grupp → Gruppstatistik**,
bredvid spelare och medlemsbehörigheter, och är tillgänglig för godkända
medlemmar. Spelöversikt visar spelsessioner och deras matcher/resultat.
Direktlänk kan använda `/grupper?grupp=GRUPP-ID&flik=statistik`.

Under **Mina grupper → vald grupp → Sessionsstatistik** kan godkända medlemmar välja en
spelsession och läsa dess matchresultat inklusive sparade laguppställningar.
Sessionens tabell och anekdoter använder samma `MatchResultsSummary`-komponent
som Resultat i spelsessionen. Tabellen räknar hela sessionen även om matchlistan
är paginerad. Visningen är läsande; matchregistrering och redigering finns i
Spelöversikt. Direktlänk: `/grupper?grupp=GRUPP-ID&flik=resultat`.
