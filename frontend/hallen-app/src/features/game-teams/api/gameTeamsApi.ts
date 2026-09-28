import { API_BASE_URL } from "../../../config/api";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import type { UpdateGameTeamRequest } from "../types/gameTeam";

export async function updateGameTeam(
  gameTeamId: string,
  request: UpdateGameTeamRequest
): Promise<GameSessionTeam> {
  const response = await fetch(`${API_BASE_URL}/api/game-teams/${gameTeamId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Kunde inte uppdatera lagnamnet.");
  }

  return response.json();
}