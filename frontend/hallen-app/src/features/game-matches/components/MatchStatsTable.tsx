import { teamColor } from "../../../shared/utils/teamColor";
import type { TeamStanding } from "../utils/gameMatchStandings";

type MatchStatsTableProps = {
  standings: TeamStanding[];
};

export function MatchStatsTable({ standings }: MatchStatsTableProps) {
  if (standings.length === 0) {
    return null;
  }

  return (
    <section className="standings mb-4" aria-label="Sammanställning">
      <h3 className="h5 mb-3">Sammanställning</h3>

      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Lag</th>
              <th className="text-end">M</th>
              <th className="text-end">V</th>
              <th className="text-end">O</th>
              <th className="text-end">F</th>
              <th className="text-end">Gjorda</th>
              <th className="text-end">Insläppta</th>
              <th className="text-end">+/-</th>
            </tr>
          </thead>

          <tbody>
            {standings.map((standing) => (
              <tr key={standing.gameTeamId}>
                <th scope="row" className="fw-semibold">
                  <span
                    className="team-dot"
                    style={{ background: teamColor(standing.gameTeamId) }}
                    aria-hidden="true"
                  />
                  {standing.gameTeamName}
                </th>
                <td className="text-end">{standing.gamesPlayed}</td>
                <td className="text-end">{standing.wins}</td>
                <td className="text-end">{standing.draws}</td>
                <td className="text-end">{standing.losses}</td>
                <td className="text-end">{standing.goalsFor}</td>
                <td className="text-end">{standing.goalsAgainst}</td>
                <td className="text-end">{standing.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
