import { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { apiFetch } from "../../shared/api/apiFetch";
import { API_BASE_URL } from "../../config/api";

async function request<T>(path = "", body?: unknown): Promise<T> {
  const response = await apiFetch(
    `${API_BASE_URL}/api/security/two-factor${path}`,
    {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  if (!response.ok) {
    const message = await response.json().catch(() => null);
    throw new Error(
      typeof message === "string"
        ? message
        : "Kunde inte ändra säkerhetsinställningarna. Försök igen.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function SecurityPage() {
  const [status, setStatus] = useState<{
    enabled: boolean;
    recoveryCodesLeft: number;
    canResetFromRecovery?: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{
    sharedKey: string;
    authenticatorUri: string;
  } | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [disable, setDisable] = useState(false);
  useEffect(() => {
    let active = true;
    request<{ enabled: boolean; recoveryCodesLeft: number }>()
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch((cause) => {
        if (active) setError((cause as Error).message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (disable) {
        await request("/disable", { password, code });
        setStatus({ enabled: false, recoveryCodesLeft: 0 });
        setDisable(false);
        setSetup(null);
        setPassword("");
        setCode("");
        setCodes([]);
      } else if (setup) {
        const result = await request<{ recoveryCodes: string[] }>("/enable", {
          password,
          code,
        });
        setCodes(result.recoveryCodes);
        setStatus({
          enabled: true,
          recoveryCodesLeft: result.recoveryCodes.length,
        });
        setSetup(null);
        setPassword("");
        setCode("");
      } else {
        setSetup(await request("/setup", { password }));
      }
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section style={{ maxWidth: 680 }}>
      <h1 className="page-title">Kontosäkerhet</h1>
      <h2 className="h5 mt-4">Tvåfaktorsinloggning</h2>
      <p className="text-muted">
        Skydda kontot med en engångskod från en autentiseringsapp, exempelvis
        Microsoft Authenticator eller Google Authenticator, utöver ditt
        lösenord. Rekommenderas särskilt för systemadministratörer.
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      {!status && !error && <Spinner size="sm" />}
      {codes.length > 0 && (
        <Alert variant="warning">
          <h3 className="h6">Spara dina återställningskoder nu</h3>
          <p>
            Varje kod kan användas en gång om du förlorar tillgången till
            autentiseringsappen. Spara dem i din lösenordshanterare. De visas
            bara denna gång.
          </p>
          <div className="row">
            {codes.map((value) => (
              <code key={value} className="col-6 mb-2">
                {value}
              </code>
            ))}
          </div>
          <Button variant="outline-secondary" onClick={() => setCodes([])}>
            Jag har sparat koderna
          </Button>
        </Alert>
      )}
      {status?.enabled && !disable && (
        <>
          <Alert variant="success">
            Tvåfaktorsinloggning är aktiverad. {status.recoveryCodesLeft}{" "}
            återställningskoder finns kvar.
          </Alert>
          <Button
            variant="outline-danger"
            disabled={busy}
            onClick={() => {
              setDisable(true);
              setCodes([]);
              setError("");
            }}
          >
            Stäng av tvåfaktorsinloggning
          </Button>
        </>
      )}
      {disable && status?.canResetFromRecovery && (
        <Alert variant="info">
          Du har nyss loggat in med en återställningskod. Bekräfta med
          lösenordet inom fem minuter för att stänga av tvåfaktorsinloggningen
          och konfigurera en ny app.
        </Alert>
      )}
      {status && (!status.enabled || disable) && (
        <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="securityPassword">
            <Form.Label>Bekräfta med ditt lösenord</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
              maxLength={128}
            />
          </Form.Group>
          {setup && (
            <>
              <p>
                Lägg till ett nytt konto manuellt i din autentiseringsapp. Välj
                tidsbaserad engångskod och ange denna nyckel:
              </p>
              <pre
                className="text-break p-3 bg-light"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {setup.sharedKey.match(/.{1,4}/g)?.join(" ")}
              </pre>
              <p className="text-muted small">
                Nyckeln är hemlig. Dela den inte med andra. Bekräfta sedan med
                appens sexsiffriga kod.
              </p>
            </>
          )}
          {(setup || (disable && !status.canResetFromRecovery)) && (
            <Form.Group className="mb-3" controlId="securityCode">
              <Form.Label>Engångskod från autentiseringsappen</Form.Label>
              <Form.Control
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={busy}
                required
                maxLength={20}
              />
            </Form.Group>
          )}
          <div className="d-flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy
                ? "Vänta…"
                : disable
                  ? "Bekräfta avstängning"
                  : setup
                    ? "Aktivera tvåfaktorsinloggning"
                    : "Konfigurera autentiseringsapp"}
            </Button>
            {(setup || disable) && (
              <Button
                variant="outline-secondary"
                disabled={busy}
                onClick={() => {
                  setSetup(null);
                  setDisable(false);
                  setPassword("");
                  setCode("");
                  setError("");
                }}
              >
                Avbryt
              </Button>
            )}
          </div>
        </Form>
      )}
    </section>
  );
}
