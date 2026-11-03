import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthPage } from "../../auth/components/AuthPage";
import type {
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from "../../auth/types/auth";
import {
  acceptInvitation,
  previewInvitation,
  type Invitation,
} from "../api/invitationsApi";

type Props = {
  requiresTwoFactor?: boolean;
  currentUser: CurrentUser | null;
  isSubmitting: boolean;
  authError: string | null;
  onLogin: (request: LoginRequest) => Promise<boolean>;
  onRegister: (request: RegisterRequest) => Promise<boolean>;
};

export function InvitationPage({
  requiresTwoFactor,
  currentUser,
  isSubmitting,
  authError,
  onLogin,
  onRegister,
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.hash.slice(1);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setInvitation(null);
      setError(null);
      try {
        if (!/^[a-fA-F0-9]{64}$/.test(token))
          throw new Error(
            "Inbjudningslänken är ofullständig. Be om en ny länk.",
          );
        const result = await previewInvitation(token);
        if (active) setInvitation(result);
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Kunde inte läsa inbjudan.",
          );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [token]);
  async function accept() {
    setIsAccepting(true);
    setError(null);
    try {
      const result = await acceptInvitation(token);
      navigate(
        result.sportsGroupId ? `/grupper?grupp=${result.sportsGroupId}` : "/",
        { replace: true },
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Kunde inte acceptera inbjudan.",
      );
    } finally {
      setIsAccepting(false);
    }
  }
  if (isLoading)
    return (
      <div className="d-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" />
        Läser inbjudan...
      </div>
    );
  return (
    <div className="mx-auto" style={{ maxWidth: 520 }}>
      <h1 className="page-title mb-3">Välkommen till Hallen!</h1>
      {invitation && (
        <>
          {invitation.sportsGroupId ? (
            <>
              <p className="mb-2">
                Du är inbjuden till <strong>{invitation.groupName}</strong> som{" "}
                <strong>
                  {
                    {
                      Member: "medlem",
                      Admin: "administratör",
                      Owner: "ägare",
                    }[invitation.role]
                  }
                </strong>
                .
              </p>
              <p className="text-muted mb-4">
                Du får tillgång till den här gruppen. Behörigheten att skapa
                egna grupper hanteras separat av en systemadministratör.
              </p>
            </>
          ) : (
            <p className="text-muted mb-4">
              Du är inbjuden att skapa ett konto i Hallen. Du börjar utan grupp
              och kan skapa egna spelargrupper eller bli inbjuden till en grupp
              senare.
            </p>
          )}
        </>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {invitation &&
        (currentUser ? (
          <>
            <p>
              Du är inloggad som <strong>{currentUser.displayName}</strong> (
              {currentUser.email}).
            </p>
            {invitation.sportsGroupId ? (
              <Button disabled={isAccepting} onClick={() => void accept()}>
                {isAccepting ? "Accepterar..." : "Acceptera inbjudan"}
              </Button>
            ) : (
              <p>
                Du har redan ett Hallen-konto och behöver inte använda
                inbjudningslänken.
              </p>
            )}
          </>
        ) : (
          <AuthPage
            requiresTwoFactor={requiresTwoFactor}
            invitationToken={token}
            isSubmitting={isSubmitting}
            errorMessage={authError}
            onLogin={onLogin}
            onRegister={async (request) => {
              const success = await onRegister(request);
              if (success)
                navigate(
                  invitation.sportsGroupId
                    ? `/grupper?grupp=${invitation.sportsGroupId}`
                    : "/",
                  {
                    replace: true,
                  },
                );
              return success;
            }}
          />
        ))}
      <Link to="/" className="d-block mt-4">
        Till Hallen
      </Link>
    </div>
  );
}
