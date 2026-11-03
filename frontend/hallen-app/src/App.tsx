import { SecurityPage } from "./features/security/SecurityPage";
import { ReleaseNotes } from "./features/release-notes/ReleaseNotes";
import { HomePage } from "./features/home/HomePage";
import { AccountsPage } from "./features/accounts/AccountsPage";
import { ResetPasswordPage } from "./features/password-recovery/PasswordRecovery";
import { Container, Spinner, Navbar, Nav, Button } from "react-bootstrap";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthPage } from "./features/auth/components/AuthPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import { PlayPage } from "./features/play/components/PlayPage";
import { SportsGroupsPage } from "./features/sports-groups/components/SportsGroupsPage";

import { InvitationPage } from "./features/invitations/components/InvitationPage";

function App() {
  const location = useLocation();
  const {
    requiresTwoFactor,
    currentUser,
    isAuthenticated,
    isLoadingUser,
    isSubmittingAuth,
    authErrorMessage,
    handleRegister,
    handleLogin,
    handleLogout,
    refreshCurrentUser,
  } = useAuth();

  if (isLoadingUser) {
    return (
      <Container className="hallen-app py-4">
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Laddar Hallen...</span>
        </div>
      </Container>
    );
  }

  if (location.pathname === "/aterstall-losenord") {
    return (
      <Container className="hallen-app py-4">
        <ResetPasswordPage />
      </Container>
    );
  }

  if (location.pathname === "/inbjudan") {
    return (
      <Container className="hallen-app py-4">
        <InvitationPage
          requiresTwoFactor={requiresTwoFactor}
          currentUser={currentUser}
          isSubmitting={isSubmittingAuth}
          authError={authErrorMessage}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="hallen-app py-4">
        <AuthPage
          requiresTwoFactor={requiresTwoFactor}
          isSubmitting={isSubmittingAuth}
          errorMessage={authErrorMessage}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </Container>
    );
  }

  return (
    <Container className="hallen-app py-4">
      <Navbar
        collapseOnSelect
        expand="lg"
        className="app-navigation mb-4"
        aria-label="Huvudmeny"
      >
        <Navbar.Brand as={NavLink} to="/" className="app-brand">
          <img
            src="/favicon.svg"
            width="34"
            height="34"
            alt=""
            className="me-2"
          />
          Hallen
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navigation" label="Visa meny" />
        <Navbar.Collapse id="main-navigation">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end eventKey="/">
              Startsida
            </Nav.Link>
            <Nav.Link as={NavLink} to="/spela" eventKey="/spela">
              Spelöversikt
            </Nav.Link>
            <Nav.Link as={NavLink} to="/grupper" eventKey="/grupper">
              Mina grupper
            </Nav.Link>
            {currentUser?.isSysAdmin && (
              <Nav.Link as={NavLink} to="/konton" eventKey="/konton">
                Konton och lösenord
              </Nav.Link>
            )}
            <Nav.Link as={NavLink} to="/sakerhet" eventKey="/sakerhet">
              Kontosäkerhet
            </Nav.Link>
            {currentUser && (
              <ReleaseNotes key={currentUser.id} userId={currentUser.id} />
            )}
          </Nav>
          <div className="navigation-account">
            <span className="text-muted small">{currentUser?.displayName}</span>
            <Button
              variant="link"
              size="sm"
              onClick={handleLogout}
              disabled={isSubmittingAuth}
            >
              Logga ut
            </Button>
          </div>
        </Navbar.Collapse>
      </Navbar>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              displayName={currentUser?.displayName}
              canCreateGroups={currentUser?.canCreateGroups ?? false}
              isSysAdmin={currentUser?.isSysAdmin ?? false}
            />
          }
        />
        {currentUser?.isSysAdmin && (
          <Route
            path="/konton"
            element={
              <AccountsPage
                currentUserId={currentUser.id}
                onPermissionsChanged={refreshCurrentUser}
              />
            }
          />
        )}
        <Route path="/sakerhet" element={<SecurityPage />} />
        <Route path="/spela" element={<PlayPage />} />
        <Route
          path="/grupper"
          element={
            <SportsGroupsPage
              currentUserId={currentUser?.id ?? ""}
              canCreateGroups={currentUser?.canCreateGroups ?? false}
            />
          }
        />
        <Route path="/medlemmar" element={<LegacyMembersRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Container>
  );
}

export default App;

function LegacyMembersRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("flik", "medlemmar");
  return <Navigate to={`/grupper?${params}`} replace />;
}
