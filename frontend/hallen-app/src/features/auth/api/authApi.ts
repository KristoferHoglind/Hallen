import type {
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

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
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
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

export async function register(request: RegisterRequest): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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

  return response.json();
}

export async function login(request: LoginRequest): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Kunde inte logga ut.");
  }
}