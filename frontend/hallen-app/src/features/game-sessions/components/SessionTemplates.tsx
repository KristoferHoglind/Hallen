import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import {
  templateRequest,
  type SessionTemplate,
} from "../api/sessionTemplatesApi";
import type { GameSession } from "../types/gameSession";
import { getGameSessionSetup } from "../../game-session-setup/api/gameSessionSetupApi";

const days = [
  "Söndag",
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
];
export function SessionTemplates({
  groupId,
  source,
  onUse,
}: {
  groupId: string;
  source?: GameSession;
  onUse?: (template: SessionTemplate) => void;
}) {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [draft, setDraft] = useState<SessionTemplate | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<SessionTemplate | null>(null);
  useEffect(() => {
    let active = true;
    templateRequest<SessionTemplate[]>(groupId)
      .then((items) => {
        if (active) setTemplates(items);
      })
      .catch(() => {
        if (active) setError("Kunde inte hämta sessionsmallarna.");
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  async function fromSession() {
    if (!source) return;
    setBusy(true);
    setError("");
    try {
      const setup = await getGameSessionSetup(source.id);
      const date = new Date(source.startsAt);
      setDraft({
        id: "",
        name: source.name,
        weekday: date.getDay(),
        time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
        numberOfTeams: setup.teams.length,
        teamNames: setup.teams.map((t) => t.name),
      });
    } catch {
      setError("Kunde inte läsa sessionen för att skapa en mall.");
    } finally {
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const saved = await templateRequest<SessionTemplate>(
        groupId,
        draft.id ? "PUT" : "POST",
        draft.id,
        draft,
      );
      setTemplates((current) =>
        [...current.filter((t) => t.id !== saved.id), saved].sort((a, b) =>
          a.name.localeCompare(b.name, "sv"),
        ),
      );
      setDraft(null);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-3" aria-label="Sessionsmallar">
      {error && <Alert variant="danger">{error}</Alert>}
      {source ? (
        <Button
          variant="outline-secondary"
          disabled={busy}
          onClick={() => void fromSession()}
        >
          <i className="bi bi-copy me-2" aria-hidden="true" />
          Spara som mall
        </Button>
      ) : (
        <details>
          <summary className="fw-semibold mb-3">
            Sessionsmallar ({templates.length})
          </summary>
          <p className="text-muted small">
            Återanvänd veckodag, tid och lag. Deltagare väljs från gruppens
            aktuella spelare.
          </p>
          {templates.map((template) => (
            <div
              key={template.id}
              className="d-flex flex-wrap align-items-center gap-2 border-bottom py-2"
            >
              <div className="me-auto">
                <strong>{template.name}</strong>
                <div className="small text-muted">
                  {days[template.weekday]} kl. {template.time} ·{" "}
                  {template.numberOfTeams} lag
                </div>
              </div>
              <Button size="sm" onClick={() => onUse?.(template)}>
                Använd mall
              </Button>
              <Button
                size="sm"
                variant="link"
                aria-label={`Redigera mallen ${template.name}`}
                onClick={() => {
                  setError("");
                  setDraft({ ...template, teamNames: [...template.teamNames] });
                }}
              >
                <i className="bi bi-pencil" />
              </Button>
              <Button
                size="sm"
                variant="link"
                className="text-danger"
                aria-label={`Ta bort mallen ${template.name}`}
                onClick={() => setDeleting(template)}
              >
                <i className="bi bi-trash" />
              </Button>
            </div>
          ))}
          <Button
            className="mt-3"
            variant="outline-primary"
            onClick={() => {
              setError("");
              setDraft({
                id: "",
                name: "",
                weekday: 1,
                time: "16:00",
                numberOfTeams: 2,
                teamNames: ["Lag 1", "Lag 2"],
              });
            }}
          >
            Skapa sessionsmall
          </Button>
        </details>
      )}
      <Modal
        show={draft !== null}
        onHide={() => {
          if (!busy) setDraft(null);
        }}
        centered
        scrollable
      >
        {draft && (
          <Form onSubmit={save}>
            <Modal.Header closeButton={!busy}>
              <Modal.Title>
                {draft.id ? "Redigera mall" : "Ny sessionsmall"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Group className="mb-3" controlId="templateName">
                <Form.Label>Namn</Form.Label>
                <Form.Control
                  autoFocus
                  onFocus={(e) => e.currentTarget.select()}
                  required
                  maxLength={200}
                  value={draft.name}
                  disabled={busy}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="templateWeekday">
                <Form.Label>Veckodag</Form.Label>
                <Form.Select
                  value={draft.weekday}
                  disabled={busy}
                  onChange={(e) =>
                    setDraft({ ...draft, weekday: Number(e.target.value) })
                  }
                >
                  {days.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3" controlId="templateTime">
                <Form.Label>Tid</Form.Label>
                <Form.Control
                  type="time"
                  required
                  value={draft.time}
                  disabled={busy}
                  onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="templateTeams">
                <Form.Label>Antal lag</Form.Label>
                <Form.Control
                  type="number"
                  min={2}
                  max={32}
                  value={draft.numberOfTeams}
                  disabled={busy}
                  onChange={(e) => {
                    const n = Math.max(2, Math.min(32, Number(e.target.value)));
                    setDraft({
                      ...draft,
                      numberOfTeams: n,
                      teamNames: Array.from(
                        { length: n },
                        (_, i) => draft.teamNames[i] ?? `Lag ${i + 1}`,
                      ),
                    });
                  }}
                />
              </Form.Group>
              {draft.teamNames.map((name, index) => (
                <Form.Group
                  key={index}
                  className="mb-2"
                  controlId={`templateTeam${index}`}
                >
                  <Form.Label>Lagnamn {index + 1}</Form.Label>
                  <Form.Control
                    value={name}
                    required
                    maxLength={100}
                    disabled={busy}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        teamNames: draft.teamNames.map((n, i) =>
                          i === index ? e.target.value : n,
                        ),
                      })
                    }
                  />
                </Form.Group>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline-secondary"
                disabled={busy}
                onClick={() => setDraft(null)}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={
                  busy ||
                  !draft.name.trim() ||
                  draft.teamNames.some((n) => !n.trim())
                }
              >
                {busy ? <Spinner size="sm" /> : "Spara mall"}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
      <Modal
        show={deleting !== null}
        onHide={() => {
          if (!busy) setDeleting(null);
        }}
        centered
      >
        <Modal.Header closeButton={!busy}>
          <Modal.Title>Ta bort mall?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Mallen ”{deleting?.name}” tas bort. Befintliga spelsessioner påverkas
          inte.{error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            disabled={busy}
            onClick={() => setDeleting(null)}
          >
            Avbryt
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (!deleting) return;
              setBusy(true);
              setError("");
              try {
                await templateRequest(groupId, "DELETE", deleting.id);
                setTemplates((current) =>
                  current.filter((t) => t.id !== deleting.id),
                );
                setDeleting(null);
              } catch (cause) {
                setError((cause as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Ta bort mall
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
