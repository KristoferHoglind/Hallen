import { useEffect, useState } from "react";
import {
  getGameSessionSetup,
  movePlayerToTeam,
  randomizeTeams,
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

  async function updateTeamName(gameTeamId: string, name: string) {
    if (!name.trim()) {
      setErrorMessage("Lagnamnet får inte vara tomt.");
      return;
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
    } catch {
      setErrorMessage("Kunde inte uppdatera lagnamnet.");
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

  async function movePlayer(playerId: string, gameTeamId: string | null) {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedSetup = await movePlayerToTeam(gameSessionId, playerId, {
        gameTeamId,
      });

      setSetup(updatedSetup);
    } catch {
      setErrorMessage("Kunde inte flytta spelaren.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    setup,
    isLoading,
    isSaving,
    errorMessage,
    updateTeamName,
    randomizeSetupTeams,
    movePlayer,
  };
}