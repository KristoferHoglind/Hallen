import { useCallback, useEffect, useState } from "react";
import {
  createPlayerForSportsGroup,
  deletePlayer,
  getPlayersBySportsGroup,
  updatePlayer,
} from "../api/playersApi";
import type { Player } from "../types/player";
import { sortPlayers } from "../utils/sortPlayers";

export function usePlayers(sportsGroupId: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPlayers = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getPlayersBySportsGroup(sportsGroupId);

      setPlayers(sortPlayers(result));
      setErrorMessage(null);
    } catch {
      setErrorMessage("Kunde inte ladda spelare.");
    } finally {
      setIsLoading(false);
    }
  }, [sportsGroupId]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);

        const result = await getPlayersBySportsGroup(sportsGroupId);

        if (!isMounted) {
          return;
        }

        setPlayers(sortPlayers(result));
        setErrorMessage(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Kunde inte ladda spelare.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [sportsGroupId]);

  async function createPlayer(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const createdPlayer = await createPlayerForSportsGroup(sportsGroupId, {
        name: trimmedName,
      });

      setPlayers((currentPlayers) =>
        sortPlayers([...currentPlayers, createdPlayer]),
      );
    } catch {
      setErrorMessage("Kunde inte skapa spelare.");
      throw new Error("Kunde inte skapa spelare.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePlayer(
    playerId: string,
    name: string,
    isActive: boolean,
  ) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await updatePlayer(playerId, {
        name: trimmedName,
        isActive,
      });

      setPlayers((currentPlayers) =>
        sortPlayers(
          currentPlayers.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  name: trimmedName,
                  isActive,
                }
              : player,
          ),
        ),
      );
    } catch {
      setErrorMessage("Kunde inte uppdatera spelare.");
      throw new Error("Kunde inte uppdatera spelare.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removePlayer(playerId: string) {
    try {
      setIsDeleting(true);
      setErrorMessage(null);

      await deletePlayer(playerId);

      setPlayers((currentPlayers) =>
        currentPlayers.filter((player) => player.id !== playerId),
      );
    } catch {
      setErrorMessage("Kunde inte ta bort spelare.");
      throw new Error("Kunde inte ta bort spelare.");
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    players,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    createPlayer,
    savePlayer,
    removePlayer,
    reloadPlayers: loadPlayers,
  };
}