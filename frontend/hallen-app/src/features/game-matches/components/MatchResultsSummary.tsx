import { useId, useMemo } from "react";
import { ResultExport } from "./ResultExport";
import { buildSessionAwards } from "../utils/sessionAwards";
import { Spinner } from "react-bootstrap";
import type { GameMatch } from "../types/gameMatch";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import { MatchStatsTable } from "./MatchStatsTable";
import { buildGameMatchStandings } from "../utils/gameMatchStandings";
import { buildGameMatchAnecdotes } from "../utils/gameMatchAnecdotes";

export function MatchResultsSummary({
  matches,
  teams,
  isLoading = false,
  sessionName = "Spelsession",
  startsAt,
}: {
  matches: GameMatch[];
  teams: GameSessionTeam[];
  isLoading?: boolean;
  sessionName?: string;
  startsAt?: string;
}) {
  const headingId = useId();
  const played = useMemo(
    () =>
      matches.filter(
        (match) => match.finishedAt && match.teamResults.length === 2,
      ),
    [matches],
  );
  const standings = useMemo(
    () => buildGameMatchStandings(played, teams),
    [played, teams],
  );
  const anecdotes = useMemo(
    () => buildGameMatchAnecdotes(played, standings),
    [played, standings],
  );
  const awards = useMemo(
    () => buildSessionAwards(played, standings),
    [played, standings],
  );
  if (isLoading)
    return (
      <div className="d-flex align-items-center gap-2">
        <Spinner size="sm" animation="border" />
        Laddar sammanställning...
      </div>
    );
  return (
    <>
      <ResultExport
        name={sessionName}
        startsAt={startsAt}
        standings={standings}
        matches={played}
        anecdote={anecdotes[0]}
        awards={awards}
      />
      <MatchStatsTable standings={standings} />
      {awards.length > 0 && (
        <section className="mt-4" aria-label="Kvällens utmärkelser">
          <h3 className="h5 mb-3">
            <i className="bi bi-award me-2" aria-hidden="true" />
            Kvällens utmärkelser
          </h3>
          <div className="row g-3">
            {awards.map((award) => (
              <div className="col-md-6" key={award.title}>
                <h4 className="h6">
                  <i className={`bi ${award.icon} me-2`} aria-hidden="true" />
                  {award.title}
                </h4>
                <p className="text-muted small mb-0">{award.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {anecdotes.length > 0 && (
        <section className="session-anecdotes mt-4" aria-labelledby={headingId}>
          <h3 className="h5 mb-3" id={headingId}>
            Snacket vid sidlinjen
          </h3>
          <ul className="list-unstyled mb-0">
            {anecdotes.map((anecdote) => (
              <li key={anecdote}>
                <i className="bi bi-chat-quote" aria-hidden="true" />
                <p>{anecdote}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {matches.length === 0 && (
        <p className="text-muted">
          När sessionens första match sparas börjar snacket vid sidlinjen!
        </p>
      )}
    </>
  );
}
