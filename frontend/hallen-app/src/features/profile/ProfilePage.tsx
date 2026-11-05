import { useEffect, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import type { CurrentUser } from "../auth/types/auth";
import { SecurityPage } from "../security/SecurityPage";
import { API_BASE_URL } from "../../config/api";
import { apiFetch } from "../../shared/api/apiFetch";

async function save(path: string, method: string, body: unknown) {
  const response = await apiFetch(`${API_BASE_URL}/api/profile${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message: unknown = await response.json().catch(() => null);
    throw new Error(
      typeof message === "string"
        ? message
        : response.status === 401
          ? "Din session har gått ut. Ladda om sidan och logga in igen."
          : "Kunde inte spara ändringen. Försök igen.",
    );
  }
}

type Props = {
  currentUser: CurrentUser;
  onProfileChanged: () => Promise<void>;
};

export function ProfilePage({ currentUser, onProfileChanged }: Props) {
  const { hash } = useLocation();
  const [name, setName] = useState(currentUser.displayName);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (hash === "#kontosakerhet")
      document.getElementById("kontosakerhet")?.scrollIntoView();
  }, [hash]);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");
    const displayName = name.trim();
    if (!displayName) {
      setNameError("Ange ett profilnamn.");
      return;
    }
    setNameBusy(true);
    try {
      await save("", "PUT", { displayName });
      setName(displayName);
      await onProfileChanged();
      setNameSuccess("Ditt profilnamn har sparats.");
    } catch (cause) {
      setNameError((cause as Error).message);
    } finally {
      setNameBusy(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword !== confirmation) {
      setPasswordError("De nya lösenorden stämmer inte överens.");
      return;
    }
    setPasswordBusy(true);
    try {
      await save("/password", "POST", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setPasswordSuccess(
        "Ditt lösenord har ändrats. Du är fortfarande inloggad här. Övriga sessioner har avslutats.",
      );
    } catch (cause) {
      setPasswordError((cause as Error).message);
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <main className="profile-page">
      <h1 className="page-title">Min profil</h1>
      <p className="text-muted">
        Hantera ditt profilnamn, lösenord och kontosäkerhet.
      </p>
      <section
        className="profile-section"
        aria-labelledby="profileDetailsTitle"
      >
        <h2 id="profileDetailsTitle" className="h4">
          Profiluppgifter
        </h2>
        {nameError && <Alert variant="danger">{nameError}</Alert>}
        {nameSuccess && (
          <Alert variant="success" role="status">
            {nameSuccess}
          </Alert>
        )}
        <Form onSubmit={saveName}>
          <Form.Group controlId="profileName" className="mb-3">
            <Form.Label>Profilnamn</Form.Label>
            <Form.Control
              autoComplete="nickname"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameSuccess("");
              }}
              required
              maxLength={100}
              disabled={nameBusy}
              aria-describedby="profileNameHelp"
            />
            <Form.Text id="profileNameHelp">
              Namnet som visas för andra medlemmar i Hallen.
            </Form.Text>
          </Form.Group>
          <div className="mb-3">
            <div className="form-label">E-postadress</div>
            <p className="text-muted text-break">{currentUser.email}</p>
          </div>
          <Button
            type="submit"
            disabled={nameBusy || name.trim() === currentUser.displayName}
          >
            {nameBusy ? "Sparar…" : "Spara profilnamn"}
          </Button>
        </Form>
      </section>
      <section
        className="profile-section"
        aria-labelledby="profilePasswordTitle"
      >
        <h2 id="profilePasswordTitle" className="h4">
          Byt lösenord
        </h2>
        {passwordError && <Alert variant="danger">{passwordError}</Alert>}
        {passwordSuccess && (
          <Alert variant="success" role="status">
            {passwordSuccess}
          </Alert>
        )}
        <Form onSubmit={savePassword}>
          <Form.Group controlId="profileCurrentPassword" className="mb-3">
            <Form.Label>Nuvarande lösenord</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              maxLength={128}
              disabled={passwordBusy}
            />
          </Form.Group>
          <Form.Group controlId="profileNewPassword" className="mb-3">
            <Form.Label>Nytt lösenord</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
              disabled={passwordBusy}
              aria-describedby="profilePasswordHelp"
            />
            <Form.Text id="profilePasswordHelp">
              Minst 8 tecken, en liten bokstav och en siffra.
            </Form.Text>
          </Form.Group>
          <Form.Group controlId="profileConfirmPassword" className="mb-3">
            <Form.Label>Bekräfta nytt lösenord</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              minLength={8}
              maxLength={128}
              disabled={passwordBusy}
            />
          </Form.Group>
          <p className="small text-muted">
            När du byter lösenord avslutas dina övriga sessioner. Du förblir
            inloggad här.
          </p>
          <Button type="submit" disabled={passwordBusy}>
            {passwordBusy ? "Ändrar…" : "Byt lösenord"}
          </Button>
        </Form>
      </section>
      <SecurityPage />
    </main>
  );
}
