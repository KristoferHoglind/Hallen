import { apiFetch } from "../../../shared/api/apiFetch";
import { useEffect, useState } from "react";
import { Alert, Badge, Form, Spinner, Table } from "react-bootstrap";
import { API_BASE_URL } from "../../../config/api";

type Partner = {
  playerId: string;
  name: string;
  matches: number;
  wins: number;
  draws: number;
};
type Outcome = {
  matchId: string;
  matchName: string;
  sessionName: string;
  startsAt: string;
  outcome: "V" | "O" | "F";
};
type Stats = {
  playerId: string;
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  form: Outcome[];
  partners: Partner[];
};
const percent = (wins: number, matches: number) =>
  matches ? Math.round((wins / matches) * 100) : 0;
const date = (value: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));

export function PlayerStatistics({ sportsGroupId }: { sportsGroupId: string }) {
  const [players, setPlayers] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    let active = true;
    apiFetch(
      `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/player-statistics`,
      { credentials: "include" },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Kunde inte hämta spelarstatistiken.");
        return response.json() as Promise<Stats[]>;
      })
      .then((data) => {
        if (active) {
          setPlayers(data);
          setSelected(data[0]?.playerId ?? "");
        }
      })
      .catch((cause) => {
        if (active) setError((cause as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sportsGroupId]);
  if (loading)
    return (
      <div>
        <Spinner size="sm" /> Laddar spelarstatistik…
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!players.length)
    return <p className="text-muted">Gruppen har inga spelare ännu.</p>;
  const visible = players.filter((p) =>
    p.name.toLocaleLowerCase("sv").includes(search.toLocaleLowerCase("sv")),
  );
  const player = players.find((p) => p.playerId === selected);
  return (
    <section aria-label="Personlig statistik">
      <h3 className="h5">
        <i className="bi bi-person-lines-fill me-2" aria-hidden="true" />
        Personlig statistik
      </h3>
      <p className="text-muted">
        Statistik från samtliga spelade matcher i gruppen, baserad på vilka som
        faktiskt spelade tillsammans.
      </p>
      <Form.Control
        type="search"
        placeholder="Sök spelare…"
        aria-label="Sök spelare i statistiken"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />
      <Form.Group controlId={`playerStats-${sportsGroupId}`} className="mb-4">
        <Form.Label>Spelare</Form.Label>
        <Form.Select
          value={visible.some((p) => p.playerId === selected) ? selected : ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="" disabled>
            {visible.length ? "Välj spelare" : "Inga spelare matchar sökningen"}
          </option>
          {visible.map((p) => (
            <option key={p.playerId} value={p.playerId}>
              {p.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      {player && <PlayerDetails player={player} />}
    </section>
  );
}
function PlayerDetails({ player }: { player: Stats }) {
  const qualified = player.partners.filter((p) => p.matches >= 5);
  const developing = player.partners.filter((p) => p.matches < 5);
  const best = qualified[0];
  const bestPartners = best
    ? qualified.filter((p) => p.wins / p.matches === best.wins / best.matches)
    : [];
  const form = player.form;
  const points = form.map((_, i) => {
    const window = form.slice(Math.max(0, i - 4), i + 1);
    return {
      x: form.length === 1 ? 300 : 35 + i * (530 / (form.length - 1)),
      y:
        145 -
        percent(window.filter((m) => m.outcome === "V").length, window.length) *
          1.2,
    };
  });
  function partnersTable(rows: Partner[]) {
    return (
      <Table responsive size="sm">
        <thead>
          <tr>
            <th scope="col">Lagkamrat</th>
            <th scope="col" aria-label="Matcher ihop">
              Matcher
            </th>
            <th scope="col" aria-label="Vinster ihop">
              Vinster
            </th>
            <th scope="col" aria-label="Vinstprocent tillsammans">
              Vinst %
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.playerId}>
              <td>{p.name}</td>
              <td>{p.matches}</td>
              <td>{p.wins}</td>
              <td>{percent(p.wins, p.matches)} %</td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }
  return (
    <>
      <h4 className="h5">{player.name}</h4>
      <div className="d-flex flex-wrap gap-4 mb-4">
        {[
          ["Matcher", player.matches],
          ["Vinster", player.wins],
          ["Oavgjorda", player.draws],
          ["Förluster", player.losses],
          ["Vinstprocent", `${percent(player.wins, player.matches)} %`],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="h4 mb-0">{value}</div>
            <span className="small text-muted">{label}</span>
          </div>
        ))}
      </div>
      {!player.matches && (
        <p className="text-muted">
          Ingen spelad match ännu. Statistiken börjar samlas när spelaren är med
          i en sparad match.
        </p>
      )}
      {form.length > 0 && (
        <section className="mb-4" aria-label="Formkurva">
          <h4 className="h6">
            <i className="bi bi-graph-up me-2" aria-hidden="true" />
            Formkurva
          </h4>
          <p className="small text-muted">
            Vinstprocent i upp till fem senaste matcherna. Visar de senaste{" "}
            {form.length} matcherna, från äldst till nyast.
          </p>
          <svg
            viewBox="0 0 600 180"
            style={{ width: "100%", maxWidth: 700 }}
            role="img"
            aria-label={`Formkurva för ${player.name}. Senaste värde ${Math.round((145 - points[points.length - 1].y) / 1.2)} procent.`}
          >
            <line x1="35" y1="145" x2="565" y2="145" stroke="#bfcac3" />
            <line x1="35" y1="25" x2="565" y2="25" stroke="#dce3dd" />
            <text x="0" y="30" fontSize="12">
              100%
            </text>
            <text x="5" y="150" fontSize="12">
              0%
            </text>
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#17614c"
              strokeWidth="3"
            />
            {points.map((p, i) => (
              <circle
                key={form[i].matchId}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#17614c"
              >
                <title>
                  {form[i].matchName} · {date(form[i].startsAt)} ·{" "}
                  {form[i].outcome}
                </title>
              </circle>
            ))}
          </svg>
          <div
            className="d-flex flex-wrap gap-2"
            aria-label="Senaste matchresultat"
          >
            {form.map((m) => (
              <Badge
                key={m.matchId}
                bg={
                  m.outcome === "V"
                    ? "success"
                    : m.outcome === "O"
                      ? "secondary"
                      : "danger"
                }
                title={`${m.matchName} · ${m.sessionName} · ${date(m.startsAt)}`}
                aria-label={`${m.matchName}, ${m.sessionName}, ${date(m.startsAt)}: ${m.outcome === "V" ? "Vinst" : m.outcome === "O" ? "Oavgjort" : "Förlust"}`}
              >
                {m.outcome}
              </Badge>
            ))}
          </div>
          <p className="small text-muted mt-2">
            V = Vinst · O = Oavgjort · F = Förlust. Utsedd vinnare vid lika
            poäng räknas som vinst.
          </p>
        </section>
      )}
      <h4 className="h6">
        <i className="bi bi-people-fill me-2" aria-hidden="true" />
        Bästa radarpartners
      </h4>
      <p className="small text-muted">
        Rangordnas efter vinstprocent, sedan antal matcher ihop. Minst fem
        gemensamma matcher krävs för att rankas.
      </p>
      {best && (
        <p className="text-success">
          {bestPartners.length === 1
            ? `Du och ${best.name} har vunnit ${best.wins} av ${best.matches} matcher tillsammans (${percent(best.wins, best.matches)} %). Motståndarna är härmed varnade!`
            : `Dina bästa radarpartners är ${bestPartners.map((p) => p.name).join(", ")} – med ${percent(best.wins, best.matches)} % vinster tillsammans!`}
        </p>
      )}
      {qualified.length ? (
        partnersTable(qualified)
      ) : (
        <p className="text-muted">
          Ingen lagkamrat har fem gemensamma matcher med dig ännu.
        </p>
      )}
      {developing.length > 0 && (
        <>
          <h5 className="h6 mt-3">Samarbeten på gång</h5>
          <p className="small text-muted">
            Färre än fem matcher ihop – lite tidigt att utse drömduon!
          </p>
          {partnersTable(developing)}
        </>
      )}
      {!player.partners.length && (
        <p className="text-muted">
          Lagkamrater visas när du har spelat i samma lag som någon annan.
        </p>
      )}
    </>
  );
}
