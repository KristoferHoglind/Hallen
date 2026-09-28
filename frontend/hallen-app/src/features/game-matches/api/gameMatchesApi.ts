import { API_BASE_URL } from "../../../config/api";
import type {
  CreateGameMatchRequest,
  GameMatch,
  UpdateGameMatchRequest,
} from "../types/gameMatch";

export async function getGameMatchesForGameSession(
  gameSessionId: string,
): Promise<GameMatch[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/matches`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte hämta matcher.");
  }

  return response.json();
}

export async function createGameMatch(
  gameSessionId: string,
  request: CreateGameMatchRequest,
): Promise<GameMatch> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/matches`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte skapa match.");
  }

  return response.json();
}

export async function updateGameMatch(
  gameMatchId: string,
  request: UpdateGameMatchRequest,
): Promise<GameMatch> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-matches/${gameMatchId}`,
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
    throw new Error("Kunde inte uppdatera match.");
  }

  return response.json();
}

export async function deleteGameMatch(gameMatchId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/game-matches/${gameMatchId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte radera match.");
  }
}
