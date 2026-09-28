import { API_BASE_URL } from "../../../config/api";
import type {
  AddSportsGroupMemberRequest,
  SportsGroupMember,
  UpdateSportsGroupMemberRoleRequest,
} from "../types/sportsGroupMember";

export async function getSportsGroupMembers(
  sportsGroupId: string,
): Promise<SportsGroupMember[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/members`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte hämta medlemmar.");
  }

  return response.json();
}

export async function addSportsGroupMember(
  sportsGroupId: string,
  request: AddSportsGroupMemberRequest,
): Promise<SportsGroupMember> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/members`,
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
    throw new Error("Kunde inte lägga till medlem.");
  }

  return response.json();
}

export async function updateSportsGroupMemberRole(
  sportsGroupId: string,
  memberId: string,
  request: UpdateSportsGroupMemberRoleRequest,
): Promise<SportsGroupMember> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/members/${memberId}/role`,
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
    throw new Error("Kunde inte ändra roll.");
  }

  return response.json();
}

export async function removeSportsGroupMember(
  sportsGroupId: string,
  memberId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/sports-groups/${sportsGroupId}/members/${memberId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Kunde inte ta bort medlem.");
  }
}