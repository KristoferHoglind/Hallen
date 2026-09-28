import { useEffect, useState } from "react";
import {
  createGameSessionForSportsGroup,
  deleteGameSession,
  getGameSessionsForSportsGroup,
  updateGameSession,
} from "../api/gameSessionsApi";
import type { GameSession } from "../types/gameSession";
import { getPlayersBySportsGroup } from "../../players/api/playersApi";
import type { Player } from "../../players/types/player";
import { sortGameSessions } from "../utils/sortGameSessions";
import { fromDateTimeLocalValue } from "../utils/gameSessionDate";

type CreateGameSessionInput = {
  name: string;
  startsAt: string;
  numberOfTeams: number;
  playerIds: string[];
};

type UpdateGameSessionInput = {
  id: string;
  name: string;
  startsAt: string;
};

export function useGameSessions(sportsGroupId: string) {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);

  const [isLoadingGameSessions, setIsLoadingGameSessions] = useState(true);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGameSessions() {
      try {
        setIsLoadingGameSessions(true);

        const result = await getGameSessionsForSportsGroup(sportsGroupId);

        if (!isMounted) {
          return;
        }

        setGameSessions(sortGameSessions(result));
        setErrorMessage(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Kunde inte ladda spelkvällar.");
      } finally {
        if (isMounted) {
          setIsLoadingGameSessions(false);
        }
      }
    }

    loadGameSessions();

    return () => {
      isMounted = false;
    };
  }, [sportsGroupId]);

  useEffect(() => {
    let isMounted = true;

    async function loadPlayers() {
      try {
        setIsLoadingPlayers(true);

        const players = await getPlayersBySportsGroup(sportsGroupId);
        const activePlayers = players.filter((player) => player.isActive);

        if (!isMounted) {
          return;
        }

        setActivePlayers(activePlayers);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Kunde inte hämta aktiva spelare.");
      } finally {
        if (isMounted) {
          setIsLoadingPlayers(false);
        }
      }
    }

    loadPlayers();

    return () => {
      isMounted = false;
    };
  }, [sportsGroupId]);

  async function createGameSession(input: CreateGameSessionInput) {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      setErrorMessage("Ange ett namn för speltillfället.");
      return;
    }

    if (!input.startsAt) {
      setErrorMessage("Välj datum och tid.");
      return;
    }

    if (input.numberOfTeams < 2) {
      setErrorMessage("Välj minst två lag.");
      return;
    }

    if (input.playerIds.length === 0) {
      setErrorMessage("Välj minst en spelare.");
      return;
    }

    if (input.playerIds.length < input.numberOfTeams) {
      setErrorMessage("Välj minst lika många spelare som antal lag.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const createdGameSession = await createGameSessionForSportsGroup(
        sportsGroupId,
        {
          name: trimmedName,
          startsAt: fromDateTimeLocalValue(input.startsAt),
          numberOfTeams: input.numberOfTeams,
          playerIds: input.playerIds,
        },
      );

      setGameSessions((currentGameSessions) =>
        sortGameSessions([...currentGameSessions, createdGameSession]),
      );
    } catch {
      setErrorMessage("Kunde inte skapa speltillfälle.");
      throw new Error("Kunde inte skapa speltillfälle.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveGameSession(input: UpdateGameSessionInput) {
    const trimmedName = input.name.trim();

    if (!trimmedName || !input.startsAt) {
      return;
    }

    const updatedStartsAt = fromDateTimeLocalValue(input.startsAt);

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await updateGameSession(input.id, {
        name: trimmedName,
        startsAt: updatedStartsAt,
      });

      setGameSessions((currentGameSessions) =>
        sortGameSessions(
          currentGameSessions.map((gameSession) =>
            gameSession.id === input.id
              ? {
                  ...gameSession,
                  name: trimmedName,
                  startsAt: updatedStartsAt,
                }
              : gameSession,
          ),
        ),
      );
    } catch {
      setErrorMessage("Kunde inte uppdatera spelkväll.");
      throw new Error("Kunde inte uppdatera spelkväll.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeGameSession(gameSessionId: string) {
    try {
      setIsDeleting(true);
      setErrorMessage(null);

      await deleteGameSession(gameSessionId);

      setGameSessions((currentGameSessions) =>
        currentGameSessions.filter(
          (gameSession) => gameSession.id !== gameSessionId,
        ),
      );
    } catch {
      setErrorMessage("Kunde inte ta bort spelkväll.");
      throw new Error("Kunde inte ta bort spelkväll.");
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    gameSessions,
    activePlayers,
    isLoading: isLoadingGameSessions || isLoadingPlayers,
    isSaving,
    isDeleting,
    errorMessage,
    createGameSession,
    saveGameSession,
    removeGameSession,
  };
}