import { Link } from "react-router-dom";

type Props = {
  displayName?: string;
  canCreateGroups: boolean;
  isSysAdmin: boolean;
};

export function HomePage({ displayName, canCreateGroups, isSysAdmin }: Props) {
  const guide = [
    {
      icon: "bi-people",
      title: "Hitta din grupp",
      text: "Öppna Spelöversikt och klicka på en grupp. Där hittar du spelsessioner, matcher och resultat.",
    },
    {
      icon: "bi-person-plus",
      title: "Spelare och medlemmar",
      text: "Under Mina grupper finns gruppinformationen. Spelare är personerna som deltar i matcherna. Medlemmar är kontona som har tillgång till gruppen. Ägare och admin kan bjuda in fler med en länk.",
    },
    {
      icon: "bi-calendar-event",
      title: "Ordna en spelsession",
      text: "Ägare och admin kan skapa en spelsession från en mall eller från grunden, ändra deltagare och flytta markerade spelare mellan lag. Under Matcher väljer ni två lag, fyller i resultatet och sparar. Vid lika poäng kan ni utse en vinnare. Avsluta sessionen för att låsa den; ägare och admin kan öppna den igen.",
    },
    {
      icon: "bi-shield-lock",
      title: "Skydda ditt konto",
      text: "Under Kontosäkerhet kan du aktivera tvåfaktorsinloggning med en autentiseringsapp. Spara de tio återställningskoderna på en säker plats om du skulle förlora telefonen.",
    },
    {
      icon: "bi-trophy",
      title: "Följ resultat och statistik",
      text: "Under Mina grupper kan du välja en spelsession i Sessionsstatistik och se matchresultat och sammanställning. Gruppstatistik visar totalstatistik, matchrekord och Vinstligan. Du kan välja datumperiod och sortera på kolumnerna. Personlig statistik visar formkurva och bästa radarpartners. I sessionens resultat finns utmärkelser och Dela resultat för att spara en resultatbild.",
    },
  ];
  return (
    <main className="home-page">
      <header className="home-intro">
        <h1 className="page-title mb-2">
          {displayName
            ? `Välkommen, ${displayName}!`
            : "Välkommen till Hallen!"}
        </h1>
        <p className="text-muted mb-4">
          Samla gruppen, ordna matcher och följ resultaten. Här är en snabbguide
          för att hitta rätt.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-primary" to="/spela">
            Till spelöversikten
            <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
          </Link>
          <Link className="btn btn-outline-secondary" to="/grupper">
            <i className="bi bi-people me-2" aria-hidden="true" />
            Mina grupper
          </Link>
        </div>
      </header>
      <section aria-labelledby="homeGuideTitle">
        <h2 className="h4 mb-3" id="homeGuideTitle">
          Så använder du Hallen
        </h2>
        <ul className="home-guide list-unstyled">
          {guide.map((item) => (
            <li key={item.title}>
              <span className="home-guide-icon" aria-hidden="true">
                <i className={`bi ${item.icon}`} />
              </span>
              <div>
                <h3 className="h6 mb-1">{item.title}</h3>
                <p className="text-muted mb-0">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="small text-muted">
          {canCreateGroups
            ? "Du kan skapa egna spelargrupper under Mina grupper och blir då gruppens ägare."
            : "Vill du skapa en egen grupp? Be en systemadministratör om behörighet. Du kan gå med i befintliga grupper via en inbjudningslänk."}
        </p>
      </section>
      <details className="home-roles mt-4">
        <summary>Roller och behörigheter</summary>
        <dl className="mt-3 mb-0">
          <dt>Medlem</dt>
          <dd>
            Kan läsa gruppinformation, se spelare och medlemmar samt följa
            matcher och statistik.
          </dd>
          <dt>Administratör</dt>
          <dd>
            Kan även hantera spelare, spelsessioner, matcher och
            gruppbeskrivning, bjuda in medlemmar och ändra roller mellan Admin
            och Medlem.
          </dd>
          <dt>Ägare</dt>
          <dd>
            Har administratörens möjligheter och kan dessutom överföra
            ägarskapet eller ta bort gruppen. Varje grupp har en ägare.
          </dd>
        </dl>
      </details>
      {isSysAdmin && (
        <section className="mt-4" aria-labelledby="homeAdminTitle">
          <h2 className="h6" id="homeAdminTitle">
            <i className="bi bi-shield-check me-2" aria-hidden="true" />
            Du är systemadministratör
          </h2>
          <p className="text-muted mb-0">
            Under <Link to="/konton">Konton och lösenord</Link> kan du bjuda in
            till Hallen, hantera kontobehörigheter och hjälpa till med
            lösenordsåterställning.
          </p>
        </section>
      )}
    </main>
  );
}
