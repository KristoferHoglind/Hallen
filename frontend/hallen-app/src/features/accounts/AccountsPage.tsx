import { AuditLogPanel } from "../security/AuditLogPanel";
import { InvitationsPanel } from "../invitations/components/InvitationsPanel";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Collapse,
  Form,
  Modal,
  Pagination,
  Spinner,
} from "react-bootstrap";
import {
  accountRequest as request,
  type Account,
  type Permissions,
} from "./accountsApi";
import { AccountMemberships } from "./AccountMemberships";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { PasswordRecoveryAdmin } from "../password-recovery/PasswordRecovery";

function AccountRow({
  account,
  onSaved,
  draft,
  onDraftChange,
  onRecoverPassword,
  onDelete,
  isCurrentUser,
}: {
  account: Account;
  onDelete: (account: Account) => void;
  isCurrentUser: boolean;
  onRecoverPassword: (account: Account) => void;
  draft?: Permissions;
  onDraftChange: (permissions: Permissions) => void;
  onSaved: (account: Account) => Promise<void>;
}) {
  const [showMemberships, setShowMemberships] = useState(false);
  const { isSysAdmin, canCreateGroups } = draft ?? account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const changed =
    isSysAdmin !== account.isSysAdmin ||
    canCreateGroups !== account.canCreateGroups;
  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await request<void>(`/${account.id}/permissions`, {
        isSysAdmin,
        canCreateGroups,
      });
      await onSaved({ ...account, isSysAdmin, canCreateGroups });
      setSaved(true);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <li className="py-3 border-bottom">
      <div className="d-flex flex-wrap justify-content-between gap-3">
        <div>
          <strong>
            {account.displayName}
            {isCurrentUser && " (du)"}
          </strong>
          <div className="text-muted small">
            {account.email}
            {!account.active && " · Inaktivt konto"}
          </div>
          <Button
            size="sm"
            variant="link"
            className="p-0 mt-2 text-decoration-none"
            aria-expanded={showMemberships}
            aria-controls={`account-memberships-${account.id}`}
            onClick={() => setShowMemberships((current) => !current)}
          >
            <i
              className={`bi ${showMemberships ? "bi-chevron-up" : "bi-chevron-down"} me-2`}
              aria-hidden="true"
            />
            Grupper ({account.memberships?.length ?? 0})
          </Button>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <Form.Check
            id={`create-groups-${account.id}`}
            label="Får skapa grupper"
            checked={canCreateGroups}
            disabled={busy || !account.active}
            onChange={(event) => {
              onDraftChange({
                isSysAdmin,
                canCreateGroups: event.target.checked,
              });
              setSaved(false);
            }}
          />
          <Form.Check
            id={`sysadmin-${account.id}`}
            label="Systemadministratör"
            checked={isSysAdmin}
            disabled={busy || !account.active}
            onChange={(event) => {
              onDraftChange({
                isSysAdmin: event.target.checked,
                canCreateGroups,
              });
              setSaved(false);
            }}
          />
          <Button
            size="sm"
            variant="outline-primary"
            disabled={busy || !changed || !account.active}
            onClick={() => void save()}
          >
            {busy ? "Sparar..." : "Spara"}
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={busy || !account.active}
            aria-label={`Återställ lösenord för ${account.displayName}`}
            onClick={() => onRecoverPassword(account)}
          >
            <i className="bi bi-key me-2" aria-hidden="true" />
            Återställ lösenord
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            disabled={busy}
            aria-label={`Ta bort kontot ${account.displayName}`}
            onClick={() => onDelete(account)}
          >
            <i className="bi bi-trash me-2" aria-hidden="true" />
            Ta bort konto
          </Button>
        </div>
      </div>
      <Collapse in={showMemberships}>
        <div id={`account-memberships-${account.id}`}>
          <AccountMemberships memberships={account.memberships ?? []} />
        </div>
      </Collapse>
      {error && (
        <Alert className="mt-2 mb-0" variant="danger">
          {error}
        </Alert>
      )}
      {saved && (
        <p className="small text-success mt-2 mb-0" role="status">
          Behörigheterna är sparade.
        </p>
      )}
    </li>
  );
}

export function AccountsPage({
  onPermissionsChanged,
  currentUserId,
}: {
  currentUserId: string;
  onPermissionsChanged: () => Promise<void>;
}) {
  const [showAudit, setShowAudit] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, Permissions>>({});
  const [recoveryAccount, setRecoveryAccount] = useState<Account | null>(null);
  const [showInvitations, setShowInvitations] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request<Account[]>()
      .then((result) => {
        if (active) setAccounts(result);
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
  async function saved(account: Account) {
    setAccounts((current) =>
      current.map((item) => (item.id === account.id ? account : item)),
    );
    setDrafts((current) => {
      const next = { ...current };
      delete next[account.id];
      return next;
    });
    await onPermissionsChanged();
  }
  async function deleted(accountId: string) {
    const name =
      accounts.find((account) => account.id === accountId)?.displayName ??
      "Kontot";
    setDeletingAccount(null);
    setRecoveryAccount((current) =>
      current?.id === accountId ? null : current,
    );
    setAccounts((current) =>
      current.filter((account) => account.id !== accountId),
    );
    setDrafts((current) => {
      const next = { ...current };
      delete next[accountId];
      return next;
    });
    setNotice(`${name} är borttagen. Gruppernas nya ägare är sparade.`);
    let reloadNeeded = false;
    if (accountId !== currentUserId) {
      try {
        setAccounts(await request<Account[]>());
      } catch {
        reloadNeeded = true;
      }
    }
    try {
      await onPermissionsChanged();
    } catch {
      reloadNeeded = true;
    }
    if (reloadNeeded)
      setNotice(
        "Kontot är borttaget. Ladda om sidan för att uppdatera övriga kontouppgifter.",
      );
  }
  const query = search.trim().toLocaleLowerCase("sv-SE");
  const filtered = accounts.filter(
    (account) =>
      account.displayName.toLocaleLowerCase("sv-SE").includes(query) ||
      account.email.toLocaleLowerCase("sv-SE").includes(query),
  );
  const size =
    pageSize === "all" ? Math.max(1, filtered.length) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * size;
  const visible = filtered.slice(offset, offset + size);
  const firstPageNumber = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPageNumber + index,
  );
  return (
    <div>
      <h1 className="page-title">Konton och lösenord</h1>
      <p className="text-muted">
        Hantera systembehörigheter för Hallens konton. Flera personer kan vara
        systemadministratörer.
      </p>
      <p className="text-muted small">
        Systemadministratörer kan hantera alla kontons behörigheter och
        återställningslänkar. Minst en aktiv systemadministratör måste finnas
        kvar. Rätten att skapa grupper gäller nya grupper; befintliga medlemskap
        påverkas inte.
      </p>
      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Button className="mb-3" onClick={() => setShowInvitations(true)}>
            <i className="bi bi-person-plus me-2" aria-hidden="true" />
            Bjud in till Hallen
          </Button>
          <Modal
            show={showInvitations}
            onHide={() => setShowInvitations(false)}
            size="lg"
            centered
            aria-labelledby="inviteHallenTitle"
          >
            <Modal.Header closeButton>
              <Modal.Title id="inviteHallenTitle">
                Bjud in till Hallen
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <InvitationsPanel isOwner={false} showHeading={false} />
            </Modal.Body>
          </Modal>
          {notice && (
            <Alert variant="success" role="status">
              {notice}
            </Alert>
          )}
          <h2 className="h5 mt-4">Kontobehörigheter</h2>
          <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
            <Form.Group controlId="accountSearch" className="flex-grow-1">
              <Form.Label>Sök konto</Form.Label>
              <Form.Control
                type="search"
                placeholder="Namn eller e-postadress"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </Form.Group>
            <Form.Group controlId="accountsPerPage">
              <Form.Label>Konton per sida</Form.Label>
              <Form.Select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(event.target.value);
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="all">Alla</option>
              </Form.Select>
            </Form.Group>
          </div>
          <p className="text-muted small" role="status">
            {filtered.length === 0
              ? "Inga konton att visa."
              : `Visar ${offset + 1}–${offset + visible.length} av ${filtered.length} konton`}
            {query && ` (${accounts.length} totalt)`}
          </p>
          {filtered.length === 0 ? (
            <p>
              {query
                ? "Inga konton matchar din sökning. Prova ett annat namn eller en annan e-postadress."
                : "Det finns inga konton ännu."}
            </p>
          ) : (
            <ul className="list-unstyled mb-3">
              {visible.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  onSaved={saved}
                  onRecoverPassword={setRecoveryAccount}
                  onDelete={setDeletingAccount}
                  isCurrentUser={account.id === currentUserId}
                  draft={drafts[account.id]}
                  onDraftChange={(permissions) =>
                    setDrafts((current) => ({
                      ...current,
                      [account.id]: permissions,
                    }))
                  }
                />
              ))}
            </ul>
          )}
          {pageCount > 1 && (
            <nav aria-label="Sidor med konton">
              <Pagination className="flex-wrap mb-3" size="sm">
                <Pagination.First
                  aria-label="Första sidan"
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                />
                <Pagination.Prev
                  aria-label="Föregående sida"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                />
                {pageNumbers.map((number) => (
                  <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    aria-label={`Sida ${number}`}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  aria-label="Nästa sida"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                />
                <Pagination.Last
                  aria-label="Sista sidan"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(pageCount)}
                />
              </Pagination>
            </nav>
          )}
          {deletingAccount && (
            <DeleteAccountModal
              key={deletingAccount.id}
              account={deletingAccount}
              isCurrentUser={deletingAccount.id === currentUserId}
              onClose={() => setDeletingAccount(null)}
              onDeleted={deleted}
            />
          )}
          {recoveryAccount && (
            <Modal
              show
              onHide={() => setRecoveryAccount(null)}
              centered
              aria-labelledby="accountRecoveryTitle"
            >
              <Modal.Header closeButton>
                <Modal.Title id="accountRecoveryTitle">
                  Återställ lösenord
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <PasswordRecoveryAdmin
                  key={recoveryAccount.id}
                  targetAccount={recoveryAccount}
                  showHeading={false}
                />
              </Modal.Body>
            </Modal>
          )}
        </>
      )}
      <details
        className="mt-4"
        onToggle={(event) => setShowAudit(event.currentTarget.open)}
      >
        <summary>Administrationslogg</summary>
        {showAudit && <AuditLogPanel />}
      </details>
    </div>
  );
}
