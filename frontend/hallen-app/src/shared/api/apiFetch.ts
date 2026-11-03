import { API_BASE_URL } from "../../config/api";

let pendingToken: Promise<string> | null = null;

export function resetCsrfToken() {
  pendingToken = null;
}
async function csrfToken(): Promise<string> {
  if (!pendingToken) {
    pendingToken = fetch(`${API_BASE_URL}/api/security/csrf`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "Kunde inte skapa en säker anslutning. Ladda om sidan och försök igen.",
          );
        const body: { token: string } = await response.json();
        return body.token;
      })
      .catch((error) => {
        pendingToken = null;
        throw error;
      });
  }
  return pendingToken;
}

export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  const headers = new Headers(init.headers);
  if (unsafe) headers.set("X-Hallen-CSRF", await csrfToken());
  const response = await fetch(input, { ...init, headers });
  // Identity changes invalidate the token, which is bound to the signed-in user.
  if (
    unsafe &&
    /\/api\/auth\/(login|register|logout|two-factor)(?:\?|$)/.test(input)
  )
    resetCsrfToken();
  if (
    response.status === 400 &&
    response.headers.get("X-Hallen-CSRF-Error") === "1"
  ) {
    resetCsrfToken();
    // Never silently retry a write: the user must explicitly try again.
    throw new Error(
      "Säkerhetssessionen har ändrats. Försök igen eller ladda om sidan.",
    );
  }
  return response;
}
