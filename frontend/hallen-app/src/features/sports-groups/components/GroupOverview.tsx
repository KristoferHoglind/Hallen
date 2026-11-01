import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { API_BASE_URL } from "../../../config/api";
import { getSportsGroup } from "../api/sportsGroupsApi";

type MatchRecord = {
  matchName: string;
  sessionName: string;
  startsAt: string;
  result: string;
  totalScore: number;
  margin: number;
};
type PlayerStats = {
  playerId: string;
  playerName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
};
type PlayerSortKey = keyof Omit<PlayerStats, "playerId"> | "winPercentage";
const playerColumns: { key: PlayerSortKey; label: string }[] = [
  { key: "playerName", label: "Spelare" },
  { key: "matches", label: "Matcher" },
  { key: "wins", label: "Vinster" },
  { key: "winPercentage", label: "Vinstprocent" },
  { key: "draws", label: "Oavgjorda" },
  { key: "losses", label: "Förluster" },
];
const winPercentage = (player: PlayerStats) =>
  player.matches > 0 ? player.wins / player.matches : 0;

type Statistics = {
  sessions: number;
  playedSessions: number;
  matches: number;
  totalScore: number;
  draws: number;
  tiebreaks: number;
  players: number;
  averageScore: number;
  highestScoringMatch: MatchRecord | null;
  biggestWin: MatchRecord | null;
  playerStandings: PlayerStats[];
};
async function groupRequest<T>(
  groupId: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${groupId}/${path}`,
    {
      method: body === undefined ? "GET" : "PUT",
      credentials: "include",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Din inloggning har gått ut. Logga in igen."
        : response.status === 403
          ? "Du saknar behörighet till den här gruppinformationen."
          : "Kunde inte läsa eller spara gruppinformationen. Försök igen.",
    );
  return response.status === 204 ? (undefined as T) : response.json();
}

export function GroupDescription({
  sportsGroupId,
  canManage,
}: {
  sportsGroupId: string;
  canManage: boolean;
}) {
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getSportsGroup(sportsGroupId)
      .then((group) => {
        if (active) setDescription(group.description);
      })
      .catch(() => {
        if (active) setError("Kunde inte läsa gruppbeskrivningen.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sportsGroupId]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await groupRequest<void>(sportsGroupId, "description", {
        description: draft,
      });
      setDescription(draft.trim());
      setEditing(false);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="group-description mb-4" aria-label="Om gruppen">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h3 className="h6 mb-0">Om gruppen</h3>
        {canManage && (
          <Button
            size="sm"
            variant="link"
            disabled={loading}
            onClick={() => {
              setDraft(description);
              setEditing(true);
            }}
          >
            <i className="bi bi-pencil me-2" aria-hidden="true" />
            {description ? "Redigera" : "Lägg till beskrivning"}
          </Button>
        )}
      </div>
      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <p
          className={`mb-0 ${description ? "" : "text-muted"}`}
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {description ||
            (canManage
              ? "Berätta om gruppen, till exempel vad ni spelar och när ni träffas."
              : "Ingen gruppbeskrivning ännu.")}
        </p>
      )}
      {!editing && error && (
        <Alert className="mt-2 mb-0" variant="danger">
          {error}
        </Alert>
      )}
      <Modal
        show={editing}
        onHide={() => {
          if (!busy) setEditing(false);
        }}
        centered
        aria-labelledby="groupDescriptionTitle"
      >
        <Modal.Header closeButton={!busy}>
          <Modal.Title id="groupDescriptionTitle">Om gruppen</Modal.Title>
        </Modal.Header>
        <Form onSubmit={(event) => void save(event)}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group controlId="groupDescription">
              <Form.Label>Gruppbeskrivning</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={draft}
                maxLength={2000}
                disabled={busy}
                placeholder="Innebandy varje måndag kl. 16.00."
                onChange={(event) => setDraft(event.target.value)}
              />
              <Form.Text>
                {draft.length}/2000 tecken. Lämna tomt för att ta bort
                beskrivningen.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Sparar..." : "Spara beskrivning"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}

function MatchContext({ match }: { match: MatchRecord }) {
  return (
    <div className="group-match-context small text-muted mt-1">
      <span>{match.sessionName}</span>
      <time dateTime={match.startsAt} className="text-nowrap">
        <i className="bi bi-calendar3 me-2" aria-hidden="true" />
        {new Date(match.startsAt).toLocaleDateString("sv-SE", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Europe/Stockholm",
        })}
      </time>
      <span>{match.result}</span>
    </div>
  );
}

export function GroupStatistics({ sportsGroupId }: { sportsGroupId: string }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState({ fromDate: "", toDate: "" });
  const [filterError, setFilterError] = useState("");
  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString("sv-SE", {
      dateStyle: "long",
      timeZone: "UTC",
    });
  function apply(event: React.FormEvent) {
    event.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      setFilterError("Från datum får inte vara efter till datum.");
      return;
    }
    setFilterError("");
    setPeriod({ fromDate, toDate });
  }
  return (
    <section aria-labelledby="groupStatisticsTitle">
      <h2 className="h4" id="groupStatisticsTitle">
        <i className="bi bi-bar-chart-line me-2" aria-hidden="true" />
        Gruppstatistik
      </h2>
      <Form onSubmit={apply} className="mb-3">
        <div className="d-flex flex-wrap align-items-end gap-3">
          <Form.Group controlId="statisticsFromDate">
            <Form.Label>Från datum</Form.Label>
            <Form.Control
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="statisticsToDate">
            <Form.Label>Till datum</Form.Label>
            <Form.Control
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </Form.Group>
          <Button type="submit">Visa statistik</Button>
          <Button
            type="button"
            variant="outline-secondary"
            disabled={
              !fromDate && !toDate && !period.fromDate && !period.toDate
            }
            onClick={() => {
              setFromDate("");
              setToDate("");
              setPeriod({ fromDate: "", toDate: "" });
              setFilterError("");
            }}
          >
            Alla datum
          </Button>
        </div>
        <Form.Text>
          Filtreras på spelsessionens datum. Båda gränsdagarna ingår. Lämna
          fälten tomma för alla datum.
        </Form.Text>
      </Form>
      {filterError && <Alert variant="warning">{filterError}</Alert>}
      <p className="small text-muted" role="status">
        {!period.fromDate && !period.toDate
          ? "Visar samtliga sessioner."
          : `Visar sessioner${period.fromDate ? ` från ${formatDate(period.fromDate)}` : ""}${period.toDate ? ` till ${formatDate(period.toDate)}` : ""}.`}
      </p>
      <GroupStatisticsResults
        key={`${sportsGroupId}:${period.fromDate}:${period.toDate}`}
        sportsGroupId={sportsGroupId}
        fromDate={period.fromDate}
        toDate={period.toDate}
      />
    </section>
  );
}

function GroupStatisticsResults({
  sportsGroupId,
  fromDate,
  toDate,
}: {
  sportsGroupId: string;
  fromDate: string;
  toDate: string;
}) {
  const [sortKey, setSortKey] = useState<PlayerSortKey>("wins");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("descending");
  function sortBy(key: PlayerSortKey) {
    setSortKey(key);
    setSortDirection(
      key === sortKey
        ? sortDirection === "ascending"
          ? "descending"
          : "ascending"
        : key === "playerName"
          ? "ascending"
          : "descending",
    );
  }
  const [stats, setStats] = useState<Statistics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    groupRequest<Statistics>(
      sportsGroupId,
      `statistics${query.size ? `?${query}` : ""}`,
    )
      .then((result) => {
        if (active) setStats(result);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [sportsGroupId, fromDate, toDate]);
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!stats)
    return (
      <div className="d-flex gap-2 align-items-center">
        <Spinner size="sm" animation="border" />
        Laddar gruppstatistik...
      </div>
    );
  const mostPlayed = Math.max(
    0,
    ...stats.playerStandings.map((player) => player.matches),
  );
  const regulars = stats.playerStandings
    .filter((player) => mostPlayed > 0 && player.matches === mostPlayed)
    .map((player) => player.playerName);
  const sortedPlayers = [...stats.playerStandings].sort((a, b) => {
    const comparison =
      sortKey === "playerName"
        ? a.playerName.localeCompare(b.playerName, "sv-SE")
        : sortKey === "winPercentage"
          ? winPercentage(a) - winPercentage(b)
          : a[sortKey] - b[sortKey];
    return (
      comparison * (sortDirection === "ascending" ? 1 : -1) ||
      b.matches - a.matches ||
      a.playerName.localeCompare(b.playerName, "sv-SE") ||
      a.playerId.localeCompare(b.playerId)
    );
  });
  return (
    <div>
      <p className="text-muted">
        Sparade, färdigspelade matcher i de valda sessionerna. Spelarstatistiken
        följer matchernas sparade laguppställningar.
      </p>
      <dl className="group-statistics-totals">
        {[
          {
            label: "Spelsessioner",
            value: stats.sessions,
            icon: "bi-calendar-event",
          },
          { label: "Spelade matcher", value: stats.matches, icon: "bi-flag" },
          {
            label: "Poäng totalt",
            value: stats.totalScore,
            icon: "bi-bullseye",
          },
          {
            label: "Poäng per match",
            value: stats.averageScore.toLocaleString("sv-SE"),
            icon: "bi-graph-up",
          },
          {
            label: "Oavgjorda matcher",
            value: stats.draws,
            icon: "bi-arrow-left-right",
          },
          {
            label: "Deltagande spelare",
            value: stats.players,
            icon: "bi-people",
          },
        ].map(({ label, value, icon }) => (
          <div key={label}>
            <dt>
              <i className={`bi ${icon} me-2`} aria-hidden="true" />
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {stats.matches === 0 ? (
        <p className="text-muted">
          {fromDate || toDate
            ? "Inga spelade matcher under den valda perioden. Prova andra datum eller välj Alla datum."
            : "Gruppens historia börjar här! När ni sparar er första match dyker rekord och spelarstatistik upp."}
        </p>
      ) : (
        <>
          <h3 className="h5 mt-4">
            <i className="bi bi-book me-2" aria-hidden="true" />
            Från gruppens historiebok
          </h3>
          <ul className="session-anecdotes group-statistics-anecdotes list-unstyled">
            <li>
              Ni har spelat {stats.matches} matcher i {stats.playedSessions}{" "}
              spelsessioner och samlat ihop {stats.totalScore} poäng. Snyggt
              jobbat!
            </li>
            {stats.highestScoringMatch && (
              <li>
                Poängfesten: {stats.highestScoringMatch.matchName} bjöd på{" "}
                {stats.highestScoringMatch.totalScore} poäng!
                <MatchContext match={stats.highestScoringMatch} />
              </li>
            )}
            {stats.biggestWin && (
              <li>
                Största segermarginalen är {stats.biggestWin.margin} poäng i{" "}
                {stats.biggestWin.matchName}.
                <MatchContext match={stats.biggestWin} />
              </li>
            )}
            {stats.draws > 0 && (
              <li>
                {stats.draws} matcher har slutat utan vinnare. Ibland vill ingen
                ge sig!
              </li>
            )}
            {stats.tiebreaks > 0 && (
              <li>
                {stats.tiebreaks} matcher hade lika poäng men fick en utsedd
                vinnare. Nerver av stål!
              </li>
            )}
            {regulars.length > 0 && (
              <li>
                {regulars.slice(0, 3).join(", ")}
                {regulars.length > 3 ? " med flera" : ""} finns bland gruppens
                flitigaste spelare med {mostPlayed} matcher vardera.
              </li>
            )}
          </ul>
        </>
      )}
      {stats.playerStandings.length > 0 && (
        <>
          <h3 className="h5 mt-4">
            <i className="bi bi-trophy me-2" aria-hidden="true" />
            Vinstligan
          </h3>
          <p className="small text-muted">
            Alla gruppens spelare visas, även de som ännu inte spelat någon
            match. Klicka på en kolumnrubrik för att sortera och klicka igen för
            att byta riktning. Vinstprocent är vinster delat med spelade
            matcher. En utsedd vinnare räknas även vid lika poäng.
          </p>
          <Table responsive size="sm">
            <thead>
              <tr>
                {playerColumns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sortKey === column.key ? sortDirection : undefined
                    }
                  >
                    <Button
                      variant="link"
                      className="p-0 text-reset fw-semibold text-decoration-none text-nowrap"
                      onClick={() => sortBy(column.key)}
                      aria-label={`Sortera efter ${column.label.toLocaleLowerCase("sv-SE")}`}
                    >
                      {column.label}
                      <i
                        className={`bi ${sortKey === column.key ? (sortDirection === "ascending" ? "bi-arrow-up" : "bi-arrow-down") : "bi-arrow-down-up"} ms-2`}
                        aria-hidden="true"
                      />
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={player.playerId}>
                  <td>{player.playerName}</td>
                  <td>{player.matches}</td>
                  <td>{player.wins}</td>
                  <td className="text-nowrap">
                    {(player.matches > 0
                      ? player.wins / player.matches
                      : 0
                    ).toLocaleString("sv-SE", {
                      style: "percent",
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td>{player.draws}</td>
                  <td>{player.losses}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
