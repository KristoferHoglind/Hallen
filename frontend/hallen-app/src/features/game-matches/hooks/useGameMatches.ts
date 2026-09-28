import { useCallback, useEffect, useState } from "react";
import {
  createGameMatch,
  deleteGameMatch,
  getGameMatchesForGameSession,
  updateGameMatch,
} from "../api/gameMatchesApi";
import type {
  CreateGameMatchRequest,
  GameMatch,
  UpdateGameMatchRequest,
} from "../types/gameMatch";
import { sortMatchesByCreatedAtDesc } from "../utils/gameMatchSorting";

export function useGameMatches(gameSessionId: string) {
  const [matches, setMatches] = useState<GameMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadMatches() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await getGameMatchesForGameSession(gameSessionId);

        if (!isActive) {
          return;
        }

        setMatches(sortMatchesByCreatedAtDesc(response));
      } catch {
        if (isActive) {
          setErrorMessage("Kunde inte hämta matcher.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      isActive = false;
    };
  }, [gameSessionId]);

  const createMatch = useCallback(
    async (request: CreateGameMatchRequest) => {
      try {
        setIsSaving(true);
        setErrorMessage(null);

        const createdMatch = await createGameMatch(gameSessionId, request);

        setMatches((current) =>
          sortMatchesByCreatedAtDesc([...current, createdMatch]),
        );

        return createdMatch;
      } catch {
        setErrorMessage("Kunde inte spara matchen.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [gameSessionId],
  );

  const updateMatch = useCallback(
    async (matchId: string, request: UpdateGameMatchRequest) => {
      try {
        setIsSaving(true);
        setErrorMessage(null);

        const updatedMatch = await updateGameMatch(matchId, request);

        setMatches((current) =>
          sortMatchesByCreatedAtDesc(
            current.map((match) =>
              match.id === updatedMatch.id ? updatedMatch : match,
            ),
          ),
        );

        return updatedMatch;
      } catch {
        setErrorMessage("Kunde inte uppdatera matchen.");
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const deleteMatch = useCallback(async (matchId: string) => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      await deleteGameMatch(matchId);

      setMatches((current) => current.filter((match) => match.id !== matchId));

      return true;
    } catch {
      setErrorMessage("Kunde inte radera matchen.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    matches,
    isLoading,
    isSaving,
    errorMessage,
    setErrorMessage,
    createMatch,
    updateMatch,
    deleteMatch,
  };
}
