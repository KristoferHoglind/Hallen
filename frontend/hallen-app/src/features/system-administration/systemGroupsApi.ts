import { apiFetch } from "../../shared/api/apiFetch";
import { API_BASE_URL } from "../../config/api";

export type SystemGroup = {
  id: string;
  name: string;
  createdAt: string;
  creatorName: string | null;
  memberCount: number;
  playerCount: number;
  sessionCount: number;
  matchCount: number;
  owner: { memberId: string; displayName: string; active: boolean } | null;
};

export type OwnershipCandidate = {
  memberId: string;
  displayName: string;
  email: string;
  role: string;
};

export async function systemGroupsRequest<T>(
  path = "",
  body?: unknown,
  method = body === undefined ? "GET" : "PUT",
): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}/api/system/groups${path}`, {
    method,
    credentials: "include",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let message = "Kunde inte hantera gruppen. Försök igen.";
    if (response.status === 401)
      message = "Din inloggning har gått ut. Logga in igen.";
    if (response.status === 403)
      message =
        "Endast systemadministratörer har tillgång till gruppadministrationen.";
    if (response.status === 404)
      message = "Gruppen finns inte längre. Ladda om grupplistan.";
    if (response.status === 400 || response.status === 409) {
      if (response.headers.get("content-type")?.includes("application/json")) {
        const error: unknown = await response.json();
        if (typeof error === "string") message = error;
      } else message = await response.text();
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
