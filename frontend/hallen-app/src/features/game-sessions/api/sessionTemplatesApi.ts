import { apiFetch } from "../../../shared/api/apiFetch";
import { API_BASE_URL } from "../../../config/api";
export type SessionTemplate = {
  id: string;
  name: string;
  weekday: number;
  time: string;
  numberOfTeams: number;
  teamNames: string[];
};
export async function templateRequest<T>(
  groupId: string,
  method = "GET",
  id = "",
  body?: unknown,
): Promise<T> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/sports-groups/${groupId}/session-templates${id ? `/${id}` : ""}`,
    {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!response.ok) throw new Error("Kunde inte hantera mallen. Försök igen.");
  return response.status === 204 ? (undefined as T) : response.json();
}
export function nextTemplateDate(
  template: Pick<SessionTemplate, "weekday" | "time">,
  now = new Date(),
) {
  const next = new Date(now);
  const [hours, minutes] = template.time.split(":").map(Number);
  next.setDate(next.getDate() + ((template.weekday - next.getDay() + 7) % 7));
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 7);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${template.time}`;
}
