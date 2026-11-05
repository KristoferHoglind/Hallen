import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Modal,
  Pagination,
  Spinner,
} from "react-bootstrap";
import { groupRoleLabel } from "../accounts/accountLabels";
import {
  systemGroupsRequest as request,
  type SystemGroup,
  type OwnershipCandidate,
} from "./systemGroupsApi";

type Action = { kind: "transfer" | "delete"; group: SystemGroup };

function GroupActionModal({
  action,
  onClose,
  onSaved,
}: {
  action: Action;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const { group, kind } = action;
  const [candidates, setCandidates] = useState<OwnershipCandidate[]>([]);
  const [loading, setLoading] = useState(kind === "transfer");
  const [memberId, setMemberId] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (kind !== "transfer") return;
    let active = true;
    request<OwnershipCandidate[]>(`/${group.id}/ownership-candidates`)
      .then((result) => {
        if (active) setCandidates(result);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [group.id, kind]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      busy ||
      stale ||
      (kind === "delete" ? confirmation !== group.name : !memberId)
    )
      return;
    setBusy(true);
    setError("");
    try {
      const expectedOwnerMemberId = group.owner?.memberId ?? null;
      if (kind === "delete") {
        await request<void>(
          `/${group.id}`,
          { confirmationName: confirmation, expectedOwnerMemberId },
          "DELETE",
        );
      } else {
        await request<void>(`/${group.id}/owner`, {
          memberId,
          expectedOwnerMemberId,
        });
      }
      await onSaved(
        kind === "delete"
          ? `${group.name} har raderats. En plats har frigjorts i skaparens gruppkvot om skaparkontot finns kvar.`
          : `Ägarskapet för ${group.name} har överlåtits. Skaparen och gruppkvoten är oförändrade.`,
      );
    } catch (cause) {
      setError((cause as Error).message);
      setStale(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      show
      centered
      onHide={() => {
        if (!busy) onClose();
      }}
      backdrop={busy ? "static" : true}
      keyboard={!busy}
      aria-labelledby="system-group-action-title"
    >
      <Modal.Header closeButton={!busy}>
        <Modal.Title id="system-group-action-title">
          {kind === "delete" ? "Radera grupp?" : "Överlåt ägarskap"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={(event) => void submit(event)}>
        <Modal.Body>
          <p>
            <strong>{group.name}</strong>
          </p>
          <p>Nuvarande ägare: {group.owner?.displayName ?? "Ägare saknas"}</p>
          {kind === "delete" ? (
            <>
              <Alert variant="warning">
                Gruppen och dess {group.playerCount} spelare,{" "}
                {group.sessionCount} spelsessioner och {group.matchCount}{" "}
                matcher raderas permanent. Även medlemskap, inbjudningar, mallar
                och statistik försvinner. Kontona behålls. Åtgärden kan inte
                ångras.
              </Alert>
              <p className="small text-muted">
                Raderingen frigör en plats i skaparens gruppkvot.
              </p>
              <Form.Group controlId="system-group-confirmation">
                <Form.Label>Skriv gruppnamnet för att bekräfta</Form.Label>
                <Form.Control
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  disabled={busy || stale}
                  required
                />
              </Form.Group>
            </>
          ) : (
            <>
              <p>
                Välj en annan aktiv, godkänd medlem som tar över gruppen. Den
                tidigare ägaren blir administratör. Gruppens innehåll, skapare
                och gruppkvot påverkas inte.
              </p>
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : candidates.length === 0 ? (
                <Alert variant="info">
                  Gruppen saknar en annan aktiv, godkänd medlem som kan ta över
                  ägarskapet.
                </Alert>
              ) : (
                <Form.Group controlId="system-group-successor">
                  <Form.Label>Ny ägare</Form.Label>
                  <Form.Select
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                    required
                    disabled={busy || stale}
                  >
                    <option value="">Välj ny ägare</option>
                    {candidates.map((candidate) => (
                      <option
                        key={candidate.memberId}
                        value={candidate.memberId}
                      >
                        {candidate.displayName} ({candidate.email}) –{" "}
                        {groupRoleLabel(candidate.role)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </>
          )}
          {error && (
            <Alert variant="danger" className="mt-3">
              {error} Stäng dialogen och uppdatera grupplistan innan du försöker
              igen.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" disabled={busy} onClick={onClose}>
            Avbryt
          </Button>
          <Button
            type="submit"
            variant={kind === "delete" ? "danger" : "primary"}
            disabled={
              busy ||
              loading ||
              stale ||
              (kind === "delete" ? confirmation !== group.name : !memberId)
            }
          >
            {busy
              ? "Sparar..."
              : kind === "delete"
                ? "Radera gruppen permanent"
                : "Överlåt ägarskapet"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export function GroupAdministration() {
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<Action | null>(null);
  useEffect(() => {
    let active = true;
    request<SystemGroup[]>()
      .then((result) => {
        if (active) setGroups(result);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function reload() {
    setLoading(true);
    setError("");
    try {
      setGroups(await request<SystemGroup[]>());
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function saved(message: string) {
    setAction(null);
    setNotice(message);
    await reload();
  }
  const query = search.trim().toLocaleLowerCase("sv-SE");
  const filtered = groups.filter((group) =>
    [group.name, group.owner?.displayName, group.creatorName].some((value) =>
      value?.toLocaleLowerCase("sv-SE").includes(query),
    ),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * 10;
  const visible = filtered.slice(offset, offset + 10);
  return (
    <section aria-labelledby="group-administration-title">
      <h2 className="h4" id="group-administration-title">
        Gruppadministration
      </h2>
      <p className="text-muted">
        Alla grupper i Hallen, även grupper du inte är medlem i. Som
        systemadministratör kan du överlåta ägarskap och radera grupper.
      </p>
      {notice && (
        <Alert variant="success" role="status">
          {notice}
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="d-flex align-items-end gap-3 mb-3">
        <Form.Group controlId="system-group-search" className="flex-grow-1">
          <Form.Label>Sök grupp, ägare eller skapare</Form.Label>
          <Form.Control
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </Form.Group>
        <Button
          variant="outline-secondary"
          disabled={loading}
          onClick={() => void reload()}
        >
          Uppdatera
        </Button>
      </div>
      {loading ? (
        <div role="status">
          <Spinner size="sm" animation="border" /> Laddar grupper...
        </div>
      ) : (
        !error && (
          <>
            <p className="small text-muted" role="status">
              {filtered.length === 0
                ? "Inga grupper att visa."
                : `Visar ${offset + 1}–${offset + visible.length} av ${filtered.length} grupper`}
              {query && ` (${groups.length} totalt)`}
            </p>
            <ul className="list-unstyled">
              {visible.map((group) => (
                <li className="py-3 border-bottom" key={group.id}>
                  <div className="d-flex flex-wrap justify-content-between gap-3">
                    <div>
                      <h3 className="h6 mb-1 text-break">{group.name}</h3>
                      <p className="mb-1">
                        Ägare: {group.owner?.displayName ?? "Ägare saknas"}
                        {group.owner &&
                          !group.owner.active &&
                          " (inaktivt konto)"}
                      </p>
                      <p className="small text-muted mb-1">
                        Skapare:{" "}
                        {group.creatorName ??
                          "Uppgift saknas eller kontot har raderats"}
                      </p>
                      <p className="small text-muted mb-0">
                        {group.memberCount} medlemmar · {group.playerCount}{" "}
                        spelare · {group.sessionCount} spelsessioner ·{" "}
                        {group.matchCount} matcher
                      </p>
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        aria-label={`Överlåt ägarskapet för ${group.name}`}
                        onClick={() => setAction({ kind: "transfer", group })}
                      >
                        Överlåt ägarskap
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        aria-label={`Radera ${group.name}`}
                        onClick={() => setAction({ kind: "delete", group })}
                      >
                        Radera grupp
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {pageCount > 1 && (
              <nav aria-label="Sidor med grupper">
                <Pagination size="sm">
                  <Pagination.First
                    disabled={currentPage === 1}
                    onClick={() => setPage(1)}
                    aria-label="Första sidan"
                  />
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                    aria-label="Föregående sida"
                  />
                  <Pagination.Item active>
                    Sida {currentPage} av {pageCount}
                  </Pagination.Item>
                  <Pagination.Next
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(currentPage + 1)}
                    aria-label="Nästa sida"
                  />
                  <Pagination.Last
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(pageCount)}
                    aria-label="Sista sidan"
                  />
                </Pagination>
              </nav>
            )}
          </>
        )
      )}
      {action && (
        <GroupActionModal
          key={`${action.kind}:${action.group.id}`}
          action={action}
          onClose={() => setAction(null)}
          onSaved={saved}
        />
      )}
    </section>
  );
}
