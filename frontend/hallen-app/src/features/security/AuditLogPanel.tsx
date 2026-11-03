import { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner, Table } from "react-bootstrap";
import { apiFetch } from "../../shared/api/apiFetch";
import { API_BASE_URL } from "../../config/api";
type Event = {
  id: string;
  createdAt: string;
  actorName: string;
  entityType: string;
  entityId: string;
  action: string;
  changedFields: string[];
};
const types: Record<string, string> = {
  AppUser: "Konto",
  SportsGroupMember: "Gruppmedlemskap",
  SportsGroup: "Grupp",
  GroupInvitation: "Inbjudan",
  GameSession: "Sessionsstatus",
};
const fields: Record<string, string> = {
  IsSysAdmin: "Systemadministratör",
  CanCreateGroups: "Skapa grupper",
  Status: "Status",
  TwoFactorEnabled: "Tvåfaktorsinloggning",
  PasswordHash: "Lösenord",
  Role: "Roll",
  RevokedAt: "Återkallad",
  Name: "Namn",
  Description: "Beskrivning",
  IsClosed: "Avslutad",
};
export function AuditLogPanel() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [data, setData] = useState<{ total: number; items: Event[] } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    apiFetch(
      `${API_BASE_URL}/api/accounts/audit?page=${page}&pageSize=${size}`,
      { credentials: "include" },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Kunde inte hämta administrationsloggen.");
        return response.json();
      })
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((cause) => {
        if (active) setError((cause as Error).message);
      });
    return () => {
      active = false;
    };
  }, [page, size, reload]);
  return (
    <section>
      <h2 className="h5 mt-4">Administrationslogg</h2>
      <p className="small text-muted">
        Visar vem som ändrat konton, behörigheter och andra administrativa
        uppgifter. Lösenord, nycklar och återställningslänkar loggas aldrig.
      </p>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => setReload((n) => n + 1)}
      >
        Uppdatera loggen
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
      {!data && !error && <Spinner size="sm" />}
      {data && (
        <>
          <Table responsive size="sm" className="mt-3">
            <thead>
              <tr>
                <th>Tid</th>
                <th>Utfört av</th>
                <th>Typ</th>
                <th>Åtgärd</th>
                <th>Ändrade uppgifter</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((event) => (
                <tr key={event.id}>
                  <td>
                    {new Intl.DateTimeFormat("sv-SE", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "Europe/Stockholm",
                    }).format(new Date(event.createdAt))}
                  </td>
                  <td>{event.actorName}</td>
                  <td title={event.entityId}>
                    {types[event.entityType] ?? event.entityType}
                  </td>
                  <td>
                    {{
                      Added: "Skapad",
                      Modified: "Ändrad",
                      Deleted: "Borttagen",
                    }[event.action] ?? event.action}
                  </td>
                  <td>
                    {event.changedFields
                      .map((field) => fields[field] ?? field)
                      .join(", ") || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!data.items.length && (
            <p className="text-muted">Inga händelser ännu.</p>
          )}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Button
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Föregående
            </Button>
            <span>
              Sida {page} av {Math.max(1, Math.ceil(data.total / size))}
            </span>
            <Button
              size="sm"
              disabled={page * size >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Nästa
            </Button>
            <Form.Select
              style={{ width: 110 }}
              aria-label="Händelser per sida"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} per sida
                </option>
              ))}
            </Form.Select>
          </div>
        </>
      )}
    </section>
  );
}
