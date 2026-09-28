import { API_BASE_URL } from "../../../config/api";
import type {
  GameSession,
  CreateGameSessionRequest,
  UpdateGameSessionRequest,
} from "../types/gameSession";

export async function getGameSessionsForSportsGroup(
  sportsGroupId: string,
): Promise<GameSession[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/game-sessions`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte hämta speltillfällen.");
  }

  return response.json();
}

export async function createGameSessionForSportsGroup(
  sportsGroupId: string,
  request: CreateGameSessionRequest,
): Promise<GameSession> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/game-sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte skapa speltillfälle.");
  }

  return response.json();
}

export async function updateGameSession(
  gameSessionId: string,
  request: UpdateGameSessionRequest,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte uppdatera spelkväll.");
  }
}

export async function deleteGameSession(gameSessionId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte ta bort spelkväll.");
  }
}
