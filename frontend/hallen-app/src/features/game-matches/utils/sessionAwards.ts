import type { GameMatch } from "../types/gameMatch";
import type { TeamStanding } from "./gameMatchStandings";
export type SessionAward = { title: string; description: string; icon: string };
export function matchWinner(match: GameMatch): string | null {
  const results = match.teamResults;
  if (results.length !== 2) return null;
  if (
    match.winnerGameTeamId &&
    results.some((r) => r.gameTeamId === match.winnerGameTeamId)
  )
    return match.winnerGameTeamId;
  if (results[0].score === results[1].score) return null;
  return results[0].score > results[1].score
    ? results[0].gameTeamId
    : results[1].gameTeamId;
}
export function buildSessionAwards(
  matches: GameMatch[],
  standings: TeamStanding[],
): SessionAward[] {
  const played = matches
    .filter((m) => m.finishedAt && m.teamResults.length === 2)
    .sort((a, b) => a.matchNumber - b.matchNumber || a.id.localeCompare(b.id));
  if (!played.length) return [];
  const people = new Map<
    string,
    { name: string; wins: number; draws: number; matches: number }
  >();
  const lost = new Set<string>();
  const comeback = new Set<string>();
  for (const match of played) {
    const winner = matchWinner(match);
    const counted = new Set<string>();
    for (const team of match.teamResults) {
      if (winner === team.gameTeamId && lost.has(team.gameTeamId))
        comeback.add(team.gameTeamId);
      if (winner && winner !== team.gameTeamId) lost.add(team.gameTeamId);
      for (const player of team.players) {
        if (counted.has(player.playerId)) continue;
        counted.add(player.playerId);
        const row = people.get(player.playerId) ?? {
          name: player.playerName,
          wins: 0,
          draws: 0,
          matches: 0,
        };
        row.matches++;
        if (winner === team.gameTeamId) row.wins++;
        if (!winner) row.draws++;
        people.set(player.playerId, row);
      }
    }
  }
  const awards: SessionAward[] = [];
  const maxWins = Math.max(0, ...Array.from(people.values(), (p) => p.wins));
  if (maxWins)
    awards.push({
      title: "Kvällens vinnarskalle",
      icon: "bi-trophy",
      description: `${Array.from(people.values())
        .filter((p) => p.wins === maxWins)
        .map((p) => p.name)
        .sort((a, b) => a.localeCompare(b, "sv"))
        .join(
          ", ",
        )} vann ${maxWins} ${maxWins === 1 ? "match" : "matcher"}. Segerreceptet sitter!`,
    });
  const maxDraws = Math.max(0, ...Array.from(people.values(), (p) => p.draws));
  if (maxDraws >= 2)
    awards.push({
      title: "Oavgjortspecialisten",
      icon: "bi-symmetry-horizontal",
      description: `${Array.from(people.values())
        .filter((p) => p.draws === maxDraws)
        .map((p) => p.name)
        .sort((a, b) => a.localeCompare(b, "sv"))
        .join(
          ", ",
        )} spelade ${maxDraws} oavgjorda matcher. Varför skiljas åt när man kan dela på äran?`,
    });
  const names = standings
    .filter((t) => comeback.has(t.gameTeamId))
    .map((t) => t.gameTeamName);
  if (names.length)
    awards.push({
      title: "Comebacklaget",
      icon: "bi-arrow-up-right-circle",
      description: `${names.join(", ")} följde upp en förlust med en senare vinst. Nya matcher, nya möjligheter!`,
    });
  const record = played.reduce((best, m) =>
    m.teamResults.reduce((sum, r) => sum + r.score, 0) >
    best.teamResults.reduce((sum, r) => sum + r.score, 0)
      ? m
      : best,
  );
  const total = record.teamResults.reduce((sum, r) => sum + r.score, 0);
  if (total > 0)
    awards.push({
      title: "Poängfesten",
      icon: "bi-stars",
      description: `${record.name || `Match ${record.matchNumber}`} bjöd på ${total} poäng totalt. Det var ingen lugn stund vid resultattavlan!`,
    });
  return awards;
}
