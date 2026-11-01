import { useEffect, useRef, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import {
  createInvitation,
  getInvitations,
  revokeInvitation,
  type Invitation,
} from "../api/invitationsApi";
import type { SportsGroupMemberRole } from "../../sports-group-members/types/sportsGroupMember";

type Props = {
  sportsGroupId?: string;
  isOwner: boolean;
  showHeading?: boolean;
};
const roleLabel = (role: SportsGroupMemberRole) =>
  ({ Member: "Medlem", Admin: "Admin", Owner: "Ägare" })[role];

export function InvitationsPanel({
  sportsGroupId,
  isOwner,
  showHeading = true,
}: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [role, setRole] = useState<SportsGroupMemberRole>("Member");
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyHint, setCopyHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const linkInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    getInvitations(sportsGroupId)
      .then((result) => {
        if (active) setInvitations(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Kunde inte hämta inbjudningar.",
          );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sportsGroupId]);

  async function create() {
    setIsSaving(true);
    setError(null);
    setCopied(false);
    setCopyHint(false);
    try {
      const result = await createInvitation(sportsGroupId, role);
      // The fragment is not sent to the web server or included in access logs.
      setLink({
        id: result.invitation.id,
        url: `${window.location.origin}/inbjudan#${result.token}`,
      });
      setInvitations((current) => [result.invitation, ...current].slice(0, 25));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Kunde inte skapa inbjudan.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link!.url);
      setCopied(true);
      setCopyHint(false);
    } catch {
      setCopyHint(true);
      linkInput.current?.focus();
      linkInput.current?.select();
    }
  }
  async function revoke(id: string) {
    setIsSaving(true);
    setError(null);
    try {
      await revokeInvitation(sportsGroupId, id);
      setInvitations((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRevoked: true } : item,
        ),
      );
      if (link?.id === id) setLink(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kunde inte återkalla inbjudan.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <section className="invitations-panel mb-5" aria-label="Inbjudningar">
      {showHeading && (
        <h2 className="h5" id="invitationsHeading">
          {sportsGroupId ? "Bjud in till gruppen" : "Bjud in till Hallen"}
        </h2>
      )}
      <p className="text-muted">
        Skapa en länk och dela den som du vill. Varje länk gäller i 72 timmar
        och kan användas av en person.
      </p>
      {sportsGroupId && (
        <p className="text-muted">
          Nya konton får tillgång till den här gruppen, men inte behörighet att
          skapa egna grupper.
        </p>
      )}
      {!sportsGroupId && (
        <p className="text-muted">
          Länken skapar ett vanligt Hallen-konto utan gruppmedlemskap.
          Användaren kan sedan skapa egna grupper eller bli inbjuden till en
          grupp.
        </p>
      )}
      <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
        {sportsGroupId && (
          <Form.Group controlId="invitationRole">
            <Form.Label>Roll i den här gruppen</Form.Label>
            <Form.Select
              className="member-role-select"
              value={role}
              disabled={isSaving}
              onChange={(event) =>
                setRole(event.target.value as SportsGroupMemberRole)
              }
            >
              <option value="Member">Medlem</option>
              {isOwner && (
                <>
                  <option value="Admin">Admin</option>
                </>
              )}
            </Form.Select>
          </Form.Group>
        )}
        <Button onClick={() => void create()} disabled={isSaving || isLoading}>
          <i className="bi bi-link-45deg me-2" aria-hidden="true" />
          {isSaving ? "Vänta..." : "Skapa inbjudningslänk"}
        </Button>
      </div>
      {link && (
        <div className="invitation-share mb-4">
          <Form.Group controlId="createdInvitationLink">
            <Form.Label>Din inbjudningslänk</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              <Form.Control
                ref={linkInput}
                value={link.url}
                readOnly
                onFocus={(event) => event.target.select()}
                className="invitation-link-input"
              />
              <Button variant="outline-secondary" onClick={() => void copy()}>
                <i
                  className={`bi ${copied ? "bi-check-lg" : "bi-copy"} me-2`}
                  aria-hidden="true"
                />
                {copied ? "Kopierad!" : "Kopiera länk"}
              </Button>
            </div>
          </Form.Group>
          <p role="status" className="text-muted small mt-2 mb-0">
            {copyHint
              ? "Automatisk kopiering fungerade inte. Länken är markerad så att du kan kopiera den själv."
              : copied
                ? "Länken är kopierad. Dela den med personen du vill bjuda in."
                : "Kopiera länken innan du lämnar sidan. Skapa en ny om du tappar bort den."}
          </p>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {isLoading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        invitations.length > 0 && (
          <>
            <h3 className="h6 mt-4">Senaste inbjudningar</h3>
            <ul className="list-unstyled">
              {invitations.map((item) => {
                const expired = new Date(item.expiresAt).getTime() <= now;
                const status = item.isUsed
                  ? "Använd"
                  : item.isRevoked
                    ? "Återkallad"
                    : expired
                      ? "Utgången"
                      : "Väntar";
                return (
                  <li key={item.id} className="invitation-list-row">
                    <div>
                      <span className="fw-semibold">
                        {sportsGroupId ? roleLabel(item.role) : "Hallen-konto"}
                      </span>
                      <span className="ms-2 small text-muted">{status}</span>
                      <div className="small text-muted">
                        Giltig till{" "}
                        {new Date(item.expiresAt).toLocaleString("sv-SE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    {!item.isUsed &&
                      !item.isRevoked &&
                      !expired &&
                      (!sportsGroupId || isOwner || item.role === "Member") && (
                        <Button
                          variant="link"
                          className="text-danger"
                          size="sm"
                          disabled={isSaving}
                          onClick={() => void revoke(item.id)}
                          aria-label={`Återkalla inbjudan för ${sportsGroupId ? roleLabel(item.role) : "Hallen-konto"}`}
                        >
                          Återkalla
                        </Button>
                      )}
                  </li>
                );
              })}
            </ul>
          </>
        )
      )}
    </section>
  );
}
