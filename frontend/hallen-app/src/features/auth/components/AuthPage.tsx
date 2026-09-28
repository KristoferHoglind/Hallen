import { useState } from "react";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";
import type { LoginRequest, RegisterRequest } from "../types/auth";

type AuthMode = "login" | "register";

type AuthPageProps = {
  isSubmitting: boolean;
  errorMessage: string | null;
  onLogin: (request: LoginRequest) => Promise<boolean>;
  onRegister: (request: RegisterRequest) => Promise<boolean>;
};

export function AuthPage({
  isSubmitting,
  errorMessage,
  onLogin,
  onRegister,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (mode === "login") {
      await onLogin({
        email,
        password,
      });

      return;
    }

    await onRegister({
      email,
      displayName,
      password,
    });
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 480 }}>
      <div className="mb-4 text-center">
        <h1 className="mb-1">Hallen</h1>
        <p className="text-muted mb-0">
          Logga in för att hantera grupper och matcher.
        </p>
      </div>

      <Card>
        <Card.Body>
          <div className="d-flex gap-2 mb-3">
            <Button
              type="button"
              variant={mode === "login" ? "primary" : "outline-primary"}
              className="flex-fill"
              onClick={() => setMode("login")}
              disabled={isSubmitting}
            >
              Logga in
            </Button>

            <Button
              type="button"
              variant={mode === "register" ? "primary" : "outline-primary"}
              className="flex-fill"
              onClick={() => setMode("register")}
              disabled={isSubmitting}
            >
              Skapa konto
            </Button>
          </div>

          {errorMessage && (
            <Alert variant="danger" className="mb-3">
              {errorMessage}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="authEmail">
              <Form.Label>E-post</Form.Label>
              <Form.Control
                type="email"
                autoComplete="email"
                value={email}
                disabled={isSubmitting}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Form.Group>

            {mode === "register" && (
              <Form.Group className="mb-3" controlId="authDisplayName">
                <Form.Label>Namn</Form.Label>
                <Form.Control
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  disabled={isSubmitting}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3" controlId="authPassword">
              <Form.Label>Lösenord</Form.Label>
              <Form.Control
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                disabled={isSubmitting}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Vänta...
                </>
              ) : mode === "login" ? (
                "Logga in"
              ) : (
                "Skapa konto"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}