import { apiFetch } from "../../../shared/api/apiFetch";
import { API_BASE_URL } from "../../../config/api";
import type { SportsGroupMemberRole } from "../../sports-group-members/types/sportsGroupMember";

export type Invitation = {
  id: string;
  sportsGroupId: string | null;
  groupName: string | null;
  role: SportsGroupMemberRole;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  isRevoked: boolean;
};

async function call<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let message = "Kunde inte hantera inbjudan. Försök igen.";
    if (response.status === 403)
      message = "Du har inte behörighet att hantera den här inbjudan.";
    else if (
      response.headers.get("content-type")?.includes("application/json")
    ) {
      const error: unknown = await response.json();
      if (typeof error === "string") message = error;
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const getInvitations = (groupId?: string) =>
  call<Invitation[]>(
    groupId
      ? `/api/sports-groups/${groupId}/invitations`
      : "/api/accounts/invitations",
  );
export const createInvitation = (
  groupId: string | undefined,
  role: SportsGroupMemberRole,
) =>
  call<{ invitation: Invitation; token: string }>(
    groupId
      ? `/api/sports-groups/${groupId}/invitations`
      : "/api/accounts/invitations",
    "POST",
    { role },
  );
export const revokeInvitation = (groupId: string | undefined, id: string) =>
  call<void>(
    groupId
      ? `/api/sports-groups/${groupId}/invitations/${id}`
      : `/api/accounts/invitations/${id}`,
    "DELETE",
  );
export const previewInvitation = (token: string) =>
  call<Invitation>("/api/invitations/preview", "POST", { token });
export const acceptInvitation = (token: string) =>
  call<{ sportsGroupId: string }>("/api/invitations/accept", "POST", { token });
