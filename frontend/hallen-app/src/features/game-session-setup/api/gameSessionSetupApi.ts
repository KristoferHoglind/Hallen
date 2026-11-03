import { apiFetch } from "../../../shared/api/apiFetch";
import { API_BASE_URL } from "../../../config/api";
import type { GameSessionSetup } from "../types/gameSessionSetup";

export async function getGameSessionSetup(
  gameSessionId: string,
): Promise<GameSessionSetup> {
  const response = await apiFetch(
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
  const response = await apiFetch(
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

export async function resetPlayers(
  gameSessionId: string,
): Promise<GameSessionSetup> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/players/reset`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!response.ok) throw new Error("Kunde inte återställa spelarna.");
  return response.json();
}

export async function updateSessionPlayers(
  gameSessionId: string,
  playerIds: string[],
): Promise<GameSessionSetup> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/players`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds }),
    },
  );
  if (!response.ok) throw new Error("Kunde inte uppdatera deltagarna.");
  return response.json();
}

export async function movePlayersToTeam(
  gameSessionId: string,
  playerIds: string[],
  gameTeamId: string | null,
): Promise<GameSessionSetup> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/game-sessions/${gameSessionId}/players/team`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds, gameTeamId }),
    },
  );
  if (!response.ok) throw new Error("Kunde inte flytta spelarna.");
  return response.json();
}
