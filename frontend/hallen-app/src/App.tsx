import { Container, Spinner, Navbar, Nav, Button } from "react-bootstrap";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { AuthPage } from "./features/auth/components/AuthPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import { PlayPage } from "./features/play/components/PlayPage";
import { SportsGroupsPage } from "./features/sports-groups/components/SportsGroupsPage";

import { MembersPage } from "./features/sports-group-members/components/MembersPage";

function App() {
  const {
    currentUser,
    isAuthenticated,
    isLoadingUser,
    isSubmittingAuth,
    authErrorMessage,
    handleRegister,
    handleLogin,
    handleLogout,
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

  if (!isAuthenticated) {
    return (
      <Container className="hallen-app py-4">
        <AuthPage
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
        <Navbar.Brand as={NavLink} to="/spela" className="app-brand">
          <img
            src="/favicon.svg"
            width="34"
            height="34"
            alt=""
            className="me-2"
          />
          Hallen
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navigation" aria-label="Visa meny" />
        <Navbar.Collapse id="main-navigation">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/spela" eventKey="/spela">
              Spela
            </Nav.Link>
            <Nav.Link as={NavLink} to="/grupper" eventKey="/grupper">
              Administrera grupper
            </Nav.Link>
            <Nav.Link as={NavLink} to="/medlemmar" eventKey="/medlemmar">
              Medlemmar och behörigheter
            </Nav.Link>
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
        <Route path="/spela" element={<PlayPage />} />
        <Route path="/grupper" element={<SportsGroupsPage />} />
        <Route path="/medlemmar" element={<MembersPage />} />
        <Route path="*" element={<Navigate to="/spela" replace />} />
      </Routes>
    </Container>
  );
}

export default App;
