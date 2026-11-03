import { apiFetch } from "../../shared/api/apiFetch";
import { API_BASE_URL } from "../../config/api";

export type Membership = {
  groupId: string;
  groupName: string;
  role: string;
  status: string;
};
export type Account = {
  id: string;
  displayName: string;
  email: string;
  active: boolean;
  isSysAdmin: boolean;
  canCreateGroups: boolean;
  memberships: Membership[];
};
export type Permissions = Pick<Account, "isSysAdmin" | "canCreateGroups">;

export async function accountRequest<T>(
  path = "",
  body?: unknown,
  method = body === undefined ? "GET" : "PUT",
): Promise<T> {
  const response = await apiFetch(`${API_BASE_URL}/api/accounts${path}`, {
    method,
    credentials: "include",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let message =
      response.status === 403
        ? "Endast systemadministratörer har tillgång till kontohanteringen."
        : "Kunde inte hantera kontot. Försök igen.";
    if (response.status === 401)
      message = "Din inloggning har gått ut. Ladda om sidan och logga in igen.";
    if (response.status === 404)
      message =
        "Kontot eller funktionen finns inte längre. Ladda om sidan och kontrollera att API:et är uppdaterat.";
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
