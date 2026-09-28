import { Container, Spinner } from "react-bootstrap";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./features/auth/components/AuthPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import { PlayPage } from "./features/play/components/PlayPage";
import { SportsGroupsPage } from "./features/sports-groups/components/SportsGroupsPage";

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
      <Container className="py-4">
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Laddar Hallen...</span>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-4">
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-1">Hallen</h1>
          <p className="text-muted mb-0">
            Inloggad som {currentUser?.displayName}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleLogout}
          disabled={isSubmittingAuth}
        >
          Logga ut
        </button>
      </div>

      <Routes>
        <Route path="/spela" element={<PlayPage />} />
        <Route path="/grupper" element={<SportsGroupsPage />} />
        <Route path="*" element={<Navigate to="/spela" replace />} />
      </Routes>
    </Container>
  );
}

export default App;
