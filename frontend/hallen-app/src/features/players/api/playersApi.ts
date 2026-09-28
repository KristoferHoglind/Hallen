import type {
  CreatePlayerRequest,
  Player,
  UpdatePlayerRequest,
} from "../types/player";
import { API_BASE_URL } from "../../../config/api";

export async function getPlayersBySportsGroup(
  sportsGroupId: string,
): Promise<Player[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/players`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte hämta spelare.");
  }

  return response.json();
}

export async function getPlayer(id: string): Promise<Player> {
  const response = await fetch(`${API_BASE_URL}/api/players/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte hämta spelaren.");
  }

  return response.json();
}

export async function createPlayerForSportsGroup(
  sportsGroupId: string,
  request: CreatePlayerRequest,
): Promise<Player> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/players`,
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
    throw new Error("Kunde inte skapa spelare.");
  }

  return response.json();
}

export async function updatePlayer(
  id: string,
  request: UpdatePlayerRequest,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/players/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Kunde inte uppdatera spelare.");
  }
}

export async function deletePlayer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/players/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte ta bort spelare.");
  }
}
