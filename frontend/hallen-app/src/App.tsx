import { ProfilePage } from "./features/profile/ProfilePage";
import { ReleaseNotes } from "./features/release-notes/ReleaseNotes";
import { HomePage } from "./features/home/HomePage";
import { SystemAdministrationPage } from "./features/system-administration/SystemAdministrationPage";
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
              <Nav.Link
                as={NavLink}
                to="/systemadministration"
                eventKey="/systemadministration"
              >
                Systemadministration
              </Nav.Link>
            )}
            {currentUser && (
              <ReleaseNotes key={currentUser.id} userId={currentUser.id} />
            )}
          </Nav>
          <Nav className="navigation-account flex-row">
            <Nav.Link
              as={NavLink}
              to="/profil"
              eventKey="/profil"
              className="profile-link"
              aria-label={`Min profil, ${currentUser?.displayName}`}
            >
              <i className="bi bi-person-circle" aria-hidden="true" />
              {currentUser?.displayName}
            </Nav.Link>
            <Button
              variant="link"
              size="sm"
              onClick={handleLogout}
              disabled={isSubmittingAuth}
            >
              Logga ut
            </Button>
          </Nav>
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
            path="/systemadministration/*"
            element={
              <SystemAdministrationPage
                currentUserId={currentUser.id}
                onPermissionsChanged={refreshCurrentUser}
              />
            }
          />
        )}
        <Route
          path="/konton"
          element={<Navigate to="/systemadministration" replace />}
        />
        <Route
          path="/profil"
          element={
            currentUser && (
              <ProfilePage
                currentUser={currentUser}
                onProfileChanged={refreshCurrentUser}
              />
            )
          }
        />
        <Route
          path="/sakerhet"
          element={<Navigate to="/profil#kontosakerhet" replace />}
        />
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
