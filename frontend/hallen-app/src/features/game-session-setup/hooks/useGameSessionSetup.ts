import { apiFetch } from "../../../shared/api/apiFetch";
import { API_BASE_URL } from "../../../config/api";
import { useEffect, useState } from "react";
import {
  getGameSessionSetup,
  movePlayersToTeam,
  randomizeTeams,
  resetPlayers,
  updateSessionPlayers,
} from "../api/gameSessionSetupApi";
import type { GameSessionSetup } from "../types/gameSessionSetup";
import { updateGameTeam } from "../../game-teams/api/gameTeamsApi";

export function useGameSessionSetup(gameSessionId: string) {
  const [setup, setSetup] = useState<GameSessionSetup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadSetup() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const setupResponse = await getGameSessionSetup(gameSessionId);

        if (isActive) {
          setSetup(setupResponse);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Kunde inte hämta speltillfällets laguppställning.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSetup();

    return () => {
      isActive = false;
    };
  }, [gameSessionId]);

  async function setSessionClosed(isClosed: boolean) {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const response = await apiFetch(
        `${API_BASE_URL}/api/game-sessions/${gameSessionId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isClosed }),
        },
      );
      if (!response.ok) throw new Error();
      const status: { isClosed: boolean } = await response.json();
      setSetup((current) =>
        current ? { ...current, isClosed: status.isClosed } : current,
      );
      return true;
    } catch {
      setErrorMessage("Kunde inte ändra sessionsstatus. Försök igen.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateTeamName(gameTeamId: string, name: string) {
    if (!name.trim()) {
      setErrorMessage("Lagnamnet får inte vara tomt.");
      return false;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedTeam = await updateGameTeam(gameTeamId, {
        name: name.trim(),
      });

      setSetup((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          teams: current.teams.map((team) =>
            team.id === updatedTeam.id ? updatedTeam : team,
          ),
        };
      });
      return true;
    } catch {
      setErrorMessage("Kunde inte uppdatera lagnamnet.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function updateParticipants(playerIds: string[]) {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSetup(await updateSessionPlayers(gameSessionId, playerIds));
      return true;
    } catch {
      setErrorMessage("Kunde inte uppdatera deltagarna. Försök igen.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function resetSetupPlayers() {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSetup(await resetPlayers(gameSessionId));
    } catch {
      setErrorMessage("Kunde inte återställa spelarna.");
    } finally {
      setIsSaving(false);
    }
  }

  async function randomizeSetupTeams() {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedSetup = await randomizeTeams(gameSessionId);
      setSetup(updatedSetup);
    } catch {
      setErrorMessage("Kunde inte slumpa lag.");
    } finally {
      setIsSaving(false);
    }
  }

  async function movePlayers(playerIds: string[], gameTeamId: string | null) {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSetup(await movePlayersToTeam(gameSessionId, playerIds, gameTeamId));
      return true;
    } catch {
      setErrorMessage("Kunde inte flytta spelarna. Försök igen.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    setSessionClosed,
    setup,
    isLoading,
    isSaving,
    errorMessage,
    updateTeamName,
    updateParticipants,
    randomizeSetupTeams,
    resetSetupPlayers,
    movePlayers,
  };
}
