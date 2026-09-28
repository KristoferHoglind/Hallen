import type { GameSession } from "../types/gameSession";

export function sortGameSessions(gameSessions: GameSession[]) {
  return [...gameSessions].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );
}