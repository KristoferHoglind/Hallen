import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import type { GameMatch } from "../types/gameMatch";

export type TeamStanding = {
  gameTeamId: string;
  gameTeamName: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export function buildGameMatchStandings(
  matches: GameMatch[],
  teams: GameSessionTeam[],
): TeamStanding[] {
  const standingsByTeamId = new Map<string, TeamStanding>();

  for (const team of teams) {
    standingsByTeamId.set(team.id, {
      gameTeamId: team.id,
      gameTeamName: team.name,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    });
  }

  for (const match of matches) {
    if (match.teamResults.length < 2) {
      continue;
    }

    const highestScore = Math.max(
      ...match.teamResults.map((result) => result.score),
    );

    const winningResults = match.teamResults.filter(
      (result) => result.score === highestScore,
    );

    const isDrawForTop = winningResults.length > 1;

    for (const result of match.teamResults) {
      const standing = standingsByTeamId.get(result.gameTeamId);

      if (!standing) {
        continue;
      }

      const goalsAgainst = match.teamResults
        .filter((otherResult) => otherResult.gameTeamId !== result.gameTeamId)
        .reduce((sum, otherResult) => sum + otherResult.score, 0);

      standing.gamesPlayed += 1;
      standing.goalsFor += result.score;
      standing.goalsAgainst += goalsAgainst;

      if (result.score === highestScore && isDrawForTop) {
        standing.draws += 1;
      } else if (result.score === highestScore) {
        standing.wins += 1;
      } else {
        standing.losses += 1;
      }

      standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
    }
  }

  return Array.from(standingsByTeamId.values()).sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (b.draws !== a.draws) {
      return b.draws - a.draws;
    }

    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    return a.gameTeamName.localeCompare(b.gameTeamName, "sv");
  });
}