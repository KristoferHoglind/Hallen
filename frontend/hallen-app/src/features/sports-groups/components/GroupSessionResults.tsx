import { useEffect, useState } from "react";
import { Alert, Form, Spinner } from "react-bootstrap";
import { getGameSessionsForSportsGroup } from "../../game-sessions/api/gameSessionsApi";
import type { GameSession } from "../../game-sessions/types/gameSession";
import { getGameMatchesForGameSession } from "../../game-matches/api/gameMatchesApi";
import { getGameSessionSetup } from "../../game-session-setup/api/gameSessionSetupApi";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import type { GameMatch } from "../../game-matches/types/gameMatch";
import { sortMatchesByCreatedAtDesc } from "../../game-matches/utils/gameMatchSorting";
import { MatchHistoryAccordion } from "../../game-matches/components/MatchHistoryAccordion";
import { MatchPagination } from "../../game-matches/components/MatchPagination";
import { MatchResultsSummary } from "../../game-matches/components/MatchResultsSummary";
import { usePagination } from "../../../shared/hooks/usePagination";

const sessionDate = (value: string) =>
  new Date(value).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm",
  });

export function GroupSessionResults({
  sportsGroupId,
}: {
  sportsGroupId: string;
}) {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getGameSessionsForSportsGroup(sportsGroupId)
      .then((result) => {
        if (!active) return;
        const sorted = [...result].sort(
          (a, b) =>
            new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime() ||
            a.name.localeCompare(b.name, "sv-SE") ||
            a.id.localeCompare(b.id),
        );
        setSessions(sorted);
        setSelectedId(sorted[0]?.id ?? "");
      })
      .catch(() => {
        if (active) setError("Kunde inte hämta gruppens spelsessioner.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sportsGroupId]);
  const selected = sessions.find((session) => session.id === selectedId);
  return (
    <section aria-labelledby="groupSessionResultsTitle">
      <h2 className="h4" id="groupSessionResultsTitle">
        <i className="bi bi-clipboard-data me-2" aria-hidden="true" />
        Sessionsstatistik
      </h2>
      <p className="text-muted">
        Välj en spelsession för att se matchresultaten, sessionens totaltabell
        och snacket vid sidlinjen.
      </p>
      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" animation="border" />
          Laddar spelsessioner...
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : sessions.length === 0 ? (
        <p className="text-muted">
          Gruppen har inga spelsessioner ännu. Resultaten visas här när ni
          börjar spela.
        </p>
      ) : (
        <>
          <Form.Group
            controlId={`groupResultsSession-${sportsGroupId}`}
            className="mb-4"
          >
            <Form.Label>Spelsession</Form.Label>
            <Form.Select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} – {sessionDate(session.startsAt)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {selected && (
            <SessionResults
              key={selected.id}
              session={selected}
              sportsGroupId={sportsGroupId}
            />
          )}
        </>
      )}
    </section>
  );
}

function SessionResults({
  session,
  sportsGroupId,
}: {
  session: GameSession;
  sportsGroupId: string;
}) {
  const [data, setData] = useState<{
    matches: GameMatch[];
    teams: GameSessionTeam[];
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      getGameMatchesForGameSession(session.id),
      getGameSessionSetup(session.id),
    ])
      .then(([savedMatches, setup]) => {
        if (!active) return;
        if (setup.sportsGroupId !== sportsGroupId)
          throw new Error("Spelsessionen tillhör inte den här gruppen.");
        const teams = [...setup.teams].sort((a, b) =>
          a.name.localeCompare(b.name, "sv"),
        );
        const names = new Map(teams.map((team) => [team.id, team.name]));
        const matches = sortMatchesByCreatedAtDesc(savedMatches).map(
          (match) => ({
            ...match,
            teamResults: match.teamResults.map((result) => ({
              ...result,
              gameTeamName: names.get(result.gameTeamId) ?? result.gameTeamName,
            })),
          }),
        );
        setData({ matches, teams });
      })
      .catch((cause: Error) => {
        if (active)
          setError(cause.message || "Kunde inte hämta sessionens resultat.");
      });
    return () => {
      active = false;
    };
  }, [session.id, sportsGroupId]);
  const pagination = usePagination({
    items: data?.matches ?? [],
    pageSize: 10,
  });
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data)
    return (
      <div className="d-flex align-items-center gap-2">
        <Spinner size="sm" animation="border" />
        Laddar matchresultat...
      </div>
    );
  return (
    <>
      <h3 className="h5 mb-1">{session.name}</h3>
      <p className="text-muted small mb-4">
        <time dateTime={session.startsAt}>{sessionDate(session.startsAt)}</time>{" "}
        · {data.matches.length} matcher
      </p>
      <h3 className="h5 mb-3">Matchresultat</h3>
      {data.matches.length === 0 ? (
        <p className="text-muted">
          Inga matcher är registrerade i den här spelsessionen ännu.
        </p>
      ) : (
        <>
          <MatchHistoryAccordion
            matches={pagination.pagedItems}
            isSaving={false}
            canManage={false}
            onEditMatch={() => {}}
            onDeleteMatch={() => {}}
          />
          <MatchPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChangePage={pagination.goToPage}
          />
        </>
      )}
      <div className="mt-4">
        <MatchResultsSummary
          sessionName={session.name}
          startsAt={session.startsAt}
          matches={data.matches}
          teams={data.teams}
        />
      </div>
    </>
  );
}
