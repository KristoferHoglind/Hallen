import { API_BASE_URL } from "../../../config/api";
import type {
  CreateSportsGroupRequest,
  SportsGroup,
  UpdateSportsGroupRequest,
} from "../types/sportsGroup";

export async function getSportsGroups(): Promise<SportsGroup[]> {
  const response = await fetch(`${API_BASE_URL}/api/sports-groups`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte hämta grupper.");
  }

  return response.json();
}

export async function getSportsGroup(id: string): Promise<SportsGroup> {
  const response = await fetch(`${API_BASE_URL}/api/sports-groups/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte hämta gruppen.");
  }

  return response.json();
}

export async function createSportsGroup(
  request: CreateSportsGroupRequest,
): Promise<SportsGroup> {
  const response = await fetch(`${API_BASE_URL}/api/sports-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Kunde inte skapa grupp.");
  }

  return response.json();
}

export async function updateSportsGroup(
  id: string,
  request: UpdateSportsGroupRequest,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sports-groups/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Kunde inte uppdatera grupp.");
  }
}

export async function deleteSportsGroup(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sports-groups/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte ta bort grupp.");
  }
}
