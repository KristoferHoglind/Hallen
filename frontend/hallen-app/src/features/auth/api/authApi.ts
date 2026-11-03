export class TwoFactorRequiredError extends Error {}
import { apiFetch } from "../../../shared/api/apiFetch";
import type { CurrentUser, LoginRequest, RegisterRequest } from "../types/auth";

import { API_BASE_URL } from "../../../config/api";

async function parseErrorResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const body = await response.json();

    if (Array.isArray(body)) {
      return body.join(" ");
    }

    if (typeof body === "string") {
      return body;
    }

    return JSON.stringify(body);
  }

  return response.text();
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await apiFetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Kunde inte hämta aktuell användare.");
  }

  return response.json();
}

async function confirmSession(response: Response): Promise<CurrentUser> {
  const user: CurrentUser = await response.json();
  const session = await getCurrentUser();
  if (session?.id !== user.id)
    throw new Error(
      "Inloggningen kunde inte sparas i webbläsaren. Kontrollera att cookies är tillåtna och försök igen.",
    );
  return session;
}

export async function register(request: RegisterRequest): Promise<CurrentUser> {
  const response = await apiFetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return confirmSession(response);
}

export async function login(request: LoginRequest): Promise<CurrentUser> {
  let response = await apiFetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (response.status === 202) {
    if (!request.twoFactorCode)
      throw new TwoFactorRequiredError(
        "Ange engångskoden från din autentiseringsapp.",
      );
    response = await apiFetch(`${API_BASE_URL}/api/auth/two-factor`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: request.twoFactorCode,
        recoveryCode: request.recoveryCode ?? false,
      }),
    });
  }
  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return confirmSession(response);
}

export async function logout(): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte logga ut.");
  }
}

export async function getRegistrationStatus(): Promise<{
  bootstrapAllowed: boolean;
}> {
  const response = await apiFetch(`${API_BASE_URL}/api/auth/registration`, {
    credentials: "include",
  });
  if (!response.ok)
    throw new Error("Kunde inte läsa registreringsinställningar.");
  return response.json();
}
