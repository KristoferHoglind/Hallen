import type { GameMatch } from "../types/gameMatch";

export function sortMatchesByCreatedAtDesc(
  matches: GameMatch[],
): GameMatch[] {
  return [...matches].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}