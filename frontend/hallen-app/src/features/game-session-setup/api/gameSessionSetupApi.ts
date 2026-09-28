import { API_BASE_URL } from "../../../config/api";
import type {
  GameSessionSetup,
  MovePlayerToTeamRequest
} from "../types/gameSessionSetup";

export async function getGameSessionSetup(
  gameSessionId: string,
): Promise<GameSessionSetup> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/setup`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte hämta laguppställning.");
  }

  return response.json();
}

export async function randomizeTeams(
  gameSessionId: string,
): Promise<GameSessionSetup> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/teams/randomize`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte slumpa lag.");
  }

  return response.json();
}

export async function movePlayerToTeam(
  gameSessionId: string,
  playerId: string,
  request: MovePlayerToTeamRequest,
): Promise<GameSessionSetup> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/players/${playerId}/team`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte flytta spelare.");
  }

  return response.json();
}
