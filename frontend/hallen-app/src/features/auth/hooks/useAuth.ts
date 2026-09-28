import { useEffect, useState } from "react";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../api/authApi";
import type {
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

export function useAuth() {
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

      return true;
    } catch (error) {
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
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoadingUser,
    isSubmittingAuth,
    authErrorMessage,
    handleRegister,
    handleLogin,
    handleLogout,
  };
}