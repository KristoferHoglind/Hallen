import { useId, useMemo } from "react";
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
}: {
  matches: GameMatch[];
  teams: GameSessionTeam[];
  isLoading?: boolean;
}) {
  const headingId = useId();
  const standings = useMemo(
    () => buildGameMatchStandings(matches, teams),
    [matches, teams],
  );
  const anecdotes = useMemo(
    () => buildGameMatchAnecdotes(matches, standings),
    [matches, standings],
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
      <MatchStatsTable standings={standings} />
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
