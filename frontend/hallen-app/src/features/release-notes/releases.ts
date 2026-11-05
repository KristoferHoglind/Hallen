// Add the newest release first. Give each published release a new, permanent ID.
// Deployments without a new entry do not show the same news again.
const sessionFeatureChanges = [
  {
    icon: "bi-calendar-event",
    title: "Kom igång snabbare med sessionsmallar",
    description:
      "Spara veckodag, tid, antal lag och lagnamn som en mall. Skapa en ny session med nästa datum förifyllt, eller spara en befintlig session som mall. Mallarna hanteras av gruppens ägare och administratörer.",
  },
  {
    icon: "bi-person-plus",
    title: "Ändra deltagare när planerna ändras",
    description:
      "Ägare och administratörer kan lägga till och ta bort spelare även efter att en session har skapats. Nya deltagare hamnar i Ej placerade. Spelade matcher behåller sin historik.",
  },
  {
    icon: "bi-ui-checks",
    title: "Flytta flera spelare samtidigt",
    description:
      "Välj Markera spelare i laguppställningen, markera en eller flera personer och välj laget de ska flyttas till. Det går också att markera alla eller flytta tillbaka spelare till Ej placerade.",
  },
  {
    icon: "bi-lock",
    title: "Avsluta sessioner utan risk för felklick",
    description:
      "Avsluta sessionen när ni har sparat alla resultat. Lag, deltagare och matcher låses då för redigering. Ägare och administratörer kan enkelt öppna sessionen igen om något behöver rättas.",
  },
  {
    icon: "bi-award",
    title: "Kvällens utmärkelser",
    description:
      "Resultatsammanställningen kan nu utse kvällens vinnarskalle, oavgjortspecialist, comebacklag och poängfest – när matchresultaten ger underlag för det.",
  },
  {
    icon: "bi-share",
    title: "Skicka resultaten till gruppchatten",
    description:
      "Dela resultat skapar en bild med tabell, matchresultat, utmärkelser och en anekdot. Ladda ned bilden eller dela direkt från telefoner som stöder det. Finns både i sessionens Resultat och under Sessionsstatistik.",
  },
  {
    icon: "bi-graph-up",
    title: "Personlig statistik och bästa radarpartners",
    description:
      "Under Mina grupper finns en ny flik med varje spelares vinstprocent, formkurva och vilka lagkamrater de lyckas bäst med. Minst fem gemensamma matcher krävs för att rankas som radarpartners. Statistiken bygger på vilka som faktiskt spelade i varje match.",
  },
  {
    icon: "bi-pencil",
    title: "Smidigare namnredigering",
    description:
      "Befintlig text markeras när du öppnar ett namnfält för redigering, så att du kan skriva direkt. Lagnamn sparas också när du lämnar namnfältet och används i matcher och resultat.",
  },
];

export const releases = [
  {
    id: "2026-11-05-profile-and-administration",
    date: "2026-11-05",
    title: "Din profil och bättre gruppadministration",
    introduction:
      "Hantera dina profiluppgifter på ett ställe, håll koll på grupper du skapat och hitta de nya verktygen för systemadministration.",
    changes: [
      {
        icon: "bi-person-circle",
        title: "Min profil samlar dina kontouppgifter",
        description:
          "Klicka på ditt namn i menyn för att ändra profilnamn, byta lösenord och hantera tvåfaktorsinloggning. När du byter lösenord förblir du inloggad här, medan dina övriga sessioner avslutas.",
      },
      {
        icon: "bi-eye-slash",
        title: "Mer privata e-postadresser",
        description:
          "Medlemslistor visar profilnamn i stället för e-postadresser. I systemadministrationen visas andra kontons e-postadresser maskerade. Din egen fullständiga e-postadress finns under Min profil.",
      },
      {
        icon: "bi-people",
        title: "Se vilka grupper du skapat och hur många platser du har kvar",
        description:
          "Konton med behörighet att skapa grupper kan ha upp till 20 skapade grupper. Under Mina grupper visas antal och återstående platser, och dina grupper märks med Skapad av dig. Ägarbyte påverkar inte skaparens kvot; när gruppen raderas frigörs en plats. Systemadministratörer har ingen gräns.",
      },
      {
        icon: "bi-shield-check",
        title: "Systemadministration med två underflikar",
        description:
          "Konton och lösenord ligger nu under Systemadministration tillsammans med nya Gruppadministration. Systemadministratörer kan söka bland alla grupper i Hallen och se ägare, skapare, medlemmar, spelare, spelsessioner och matcher.",
      },
      {
        icon: "bi-arrow-left-right",
        title: "Hjälp grupper vidare när ägaren är frånvarande",
        description:
          "Systemadministratörer kan överlåta ägarskapet till en annan aktiv, godkänd medlem. Den tidigare ägaren blir administratör och gruppens innehåll behålls. Grupper kan också raderas permanent efter bekräftelse med gruppnamnet. Dialogen visar vad som försvinner, och åtgärderna registreras i administrationsloggen.",
      },
    ],
  },
  {
    id: "2026-11-03-security",
    date: "2026-11-03",
    title: "Mer spel, mindre fix!",
    introduction:
      "Hallen har fått flera nyheter som gör det enklare att ordna spelsessioner, följa resultaten och hitta era bästa radarpartners.",
    changes: [
      ...sessionFeatureChanges,
      {
        icon: "bi-shield-lock",
        title: "Skydda ditt konto med tvåfaktorsinloggning",
        description:
          "Under Kontosäkerhet kan du nu aktivera engångskoder från en autentiseringsapp. Spara återställningskoderna i din lösenordshanterare så att du kan logga in även om du förlorar telefonen. Rekommenderas särskilt för systemadministratörer.",
      },
      {
        icon: "bi-clock-history",
        title: "Administrationslogg",
        description:
          "Systemadministratörer kan följa ändringar av konton och behörigheter i loggen under Konton och lösenord. Lösenord och hemliga nycklar loggas aldrig.",
      },
      {
        icon: "bi-lock",
        title: "Förstärkt säkerhet bakom kulisserna",
        description:
          "Inloggning, API och databas har fått ytterligare skydd. Om en säkerhetssession ändras kan du behöva ladda om sidan och försöka igen.",
      },
      {
        icon: "bi-people",
        title: "Spelaruppställning för varje match",
        description:
          "Dela resultat visar nu spelarna under respektive lag och poäng i varje match. Uppställningen hämtas från den sparade matchen, så senare lagbyten påverkar inte vilka spelare som visas. Längre spelarlistor radbryts automatiskt.",
      },
    ],
  },
  {
    id: "2026-11-02",
    date: "2026-11-02",
    title: "Mer spel, mindre fix!",
    introduction:
      "Hallen har fått flera nyheter som gör det enklare att ordna spelsessioner, följa resultaten och hitta era bästa radarpartners.",
    changes: sessionFeatureChanges,
  },
];

export const latestRelease = releases[0];
