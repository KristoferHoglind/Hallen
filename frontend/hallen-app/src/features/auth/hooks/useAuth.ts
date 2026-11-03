import { useEffect, useState } from "react";
import {
  getCurrentUser,
  login,
  logout,
  register,
  TwoFactorRequiredError,
} from "../api/authApi";
import type { CurrentUser, LoginRequest, RegisterRequest } from "../types/auth";

export function useAuth() {
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCurrentUser() {
      try {
        setIsLoadingUser(true);
        setAuthErrorMessage(null);

        const user = await getCurrentUser();

        if (isActive) {
          setCurrentUser(user);
        }
      } catch {
        if (isActive) {
          setAuthErrorMessage("Kunde inte kontrollera inloggning.");
        }
      } finally {
        if (isActive) {
          setIsLoadingUser(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, []);

  async function refreshCurrentUser() {
    setCurrentUser(await getCurrentUser());
  }

  async function handleRegister(request: RegisterRequest) {
    try {
      setIsSubmittingAuth(true);
      setAuthErrorMessage(null);

      const user = await register(request);
      setCurrentUser(user);

      return true;
    } catch (error) {
      setAuthErrorMessage(
        error instanceof Error ? error.message : "Kunde inte registrera konto.",
      );

      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleLogin(request: LoginRequest) {
    try {
      setIsSubmittingAuth(true);
      setAuthErrorMessage(null);

      const user = await login(request);
      setCurrentUser(user);
      setRequiresTwoFactor(false);

      return true;
    } catch (error) {
      if (error instanceof TwoFactorRequiredError) setRequiresTwoFactor(true);
      setAuthErrorMessage(
        error instanceof Error ? error.message : "Kunde inte logga in.",
      );

      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      setIsSubmittingAuth(true);
      setAuthErrorMessage(null);

      await logout();
      setCurrentUser(null);
    } catch {
      setAuthErrorMessage("Kunde inte logga ut.");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  return {
    requiresTwoFactor,
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoadingUser,
    isSubmittingAuth,
    authErrorMessage,
    handleRegister,
    handleLogin,
    handleLogout,
    refreshCurrentUser,
  };
}
