import type { Player } from "../types/player";

export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    return a.name.localeCompare(b.name, "sv-SE");
  });
}