import { apiFetch } from "../../shared/api/apiFetch";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

type Account = {
  id: string;
  displayName: string;
  email: string;
  active: boolean;
};
async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/password-recovery/${path}`,
    {
      method: body === undefined ? "GET" : "POST",
      credentials: "include",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  if (!response.ok) {
    let message =
      response.status === 403
        ? "Du har inte behörighet att återställa lösenordet för det här kontot."
        : "Kunde inte hantera återställningen. Försök igen.";
    if (response.status === 429)
      message = "För många försök. Vänta en stund och försök igen.";
    if (response.headers.get("content-type")?.includes("application/json")) {
      const error: unknown = await response.json();
      if (typeof error === "string") message = error;
    } else if (response.status === 400) {
      message = (await response.text()) || message;
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export function PasswordRecoveryAdmin({
  groupId,
  groupAccounts = [],
  showHeading = true,
  targetAccount,
}: {
  groupId?: string;
  targetAccount?: Account;
  showHeading?: boolean;
  groupAccounts?: Account[];
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelected] = useState("");
  const selected = targetAccount?.id ?? selectedAccountId;
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (groupId || targetAccount) return;
    let active = true;
    call<Account[]>("users")
      .then((result) => {
        if (active) setAccounts(result);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [groupId, targetAccount]);
  async function create() {
    setBusy(true);
    setError("");
    setLink("");
    setMessage("");
    try {
      const result = await call<{ userId: string; token: string }>(
        groupId ? `groups/${groupId}/users/${selected}` : `users/${selected}`,
        {},
      );
      const fragment = new URLSearchParams({
        user: result.userId,
        token: result.token,
      });
      setLink(`${window.location.origin}/aterstall-losenord#${fragment}`);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Länken är kopierad!");
    } catch {
      input.current?.focus();
      input.current?.select();
      setMessage("Kopiera den markerade länken manuellt.");
    }
  }
  const availableAccounts = targetAccount
    ? [targetAccount]
    : groupId
      ? groupAccounts
      : accounts;
  return (
    <section style={{ maxWidth: 640 }}>
      {showHeading && <h2 className="h5">Återställ lösenord</h2>}
      <p className="text-muted">
        Skapa en återställningslänk för ett konto och dela den direkt med rätt
        person. Länken gäller i en timme och slutar fungera när lösenordet har
        ändrats.
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      {targetAccount ? (
        <p className="mb-3">
          <strong>{targetAccount.displayName}</strong>
          <br />
          <span className="text-muted">{targetAccount.email}</span>
        </p>
      ) : (
        <Form.Group controlId="recoveryAccount" className="mb-3">
          <Form.Label>Konto</Form.Label>
          <Form.Select
            value={selected}
            disabled={busy}
            onChange={(event) => {
              setSelected(event.target.value);
              setLink("");
              setMessage("");
            }}
          >
            <option value="">Välj konto</option>
            {availableAccounts
              .filter((account) => account.active)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName} – {account.email}
                </option>
              ))}
          </Form.Select>
        </Form.Group>
      )}
      <Button
        disabled={!selected || busy || targetAccount?.active === false}
        onClick={() => void create()}
      >
        {busy ? "Vänta..." : "Skapa återställningslänk"}
      </Button>
      {link && (
        <Form.Group controlId="recoveryLink" className="mt-4">
          <Form.Label>
            Återställningslänk för{" "}
            {
              availableAccounts.find((account) => account.id === selected)
                ?.email
            }
          </Form.Label>
          <Form.Control
            ref={input}
            value={link}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <Button
            className="mt-2"
            variant="outline-secondary"
            onClick={() => void copy()}
          >
            Kopiera länk
          </Button>
          <p role="status" className="small mt-2">
            {message || "Kopiera länken innan du lämnar sidan."}
          </p>
        </Form.Group>
      )}
    </section>
  );
}

export function ResetPasswordPage() {
  const { hash } = useLocation();
  const params = new URLSearchParams(hash.slice(1));
  const userId = params.get("user");
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Lösenorden stämmer inte överens.");
      return;
    }
    setBusy(true);
    try {
      await call<void>("reset", { userId, token, password });
      window.history.replaceState(null, "", window.location.pathname);
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mx-auto" style={{ maxWidth: 480 }}>
      <h1 className="h3">Välj ett nytt lösenord</h1>
      {done ? (
        <>
          <Alert variant="success">
            Ditt lösenord är ändrat. Logga in med det nya lösenordet.
          </Alert>
          <Link to="/" reloadDocument>
            Till inloggningen
          </Link>
        </>
      ) : !userId || !token ? (
        <Alert variant="warning">
          Återställningslänken saknas. Be din gruppägare eller admin om en ny
          länk.
        </Alert>
      ) : (
        <>
          <p className="text-muted">
            Använd minst 8 tecken, en liten bokstav och en siffra.
          </p>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={(event) => void submit(event)}>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>Nytt lösenord</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Upprepa lösenordet</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmation}
                disabled={busy}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </Form.Group>
            <Button type="submit" disabled={busy}>
              {busy ? "Vänta..." : "Spara nytt lösenord"}
            </Button>
          </Form>
        </>
      )}
    </section>
  );
}
