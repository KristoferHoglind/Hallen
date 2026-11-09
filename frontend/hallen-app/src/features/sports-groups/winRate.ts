export function winRate({
  wins,
  matches,
  draws,
}: {
  wins: number;
  matches: number;
  draws: number;
}) {
  const decidedMatches = matches - draws;
  return decidedMatches > 0 ? wins / decidedMatches : 0;
}
