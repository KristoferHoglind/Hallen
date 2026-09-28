import { useState } from "react";
import { Alert, Card, Spinner } from "react-bootstrap";
import { usePlayers } from "../hooks/usePlayers";
import type { Player } from "../types/player";
import { CreatePlayerForm } from "./CreatePlayerForm";
import { DeletePlayerModal } from "./DeletePlayerModal";
import { EditPlayerModal } from "./EditPlayerModal";
import { PlayersList } from "./PlayersList";

type PlayersPanelProps = {
  sportsGroupId: string;
  canManage: boolean;
};

export function PlayersPanel({
  sportsGroupId,
  canManage,
}: PlayersPanelProps) {
  const {
    players,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    createPlayer,
    savePlayer,
    removePlayer,
  } = usePlayers(sportsGroupId);

  const [playerBeingEdited, setPlayerBeingEdited] = useState<Player | null>(
    null,
  );
  const [playerBeingDeleted, setPlayerBeingDeleted] = useState<Player | null>(
    null,
  );

  async function handleCreatePlayer(name: string) {
    await createPlayer(name);
  }

  async function handleSavePlayer(
    playerId: string,
    name: string,
    isActive: boolean,
  ) {
    await savePlayer(playerId, name, isActive);
    setPlayerBeingEdited(null);
  }

  async function handleDeletePlayer(playerId: string) {
    await removePlayer(playerId);
    setPlayerBeingDeleted(null);
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Card.Title>Spelare</Card.Title>

          {canManage && (
            <CreatePlayerForm
              isSaving={isSaving}
              onCreatePlayer={handleCreatePlayer}
            />
          )}

          {!canManage && (
            <p className="text-muted mb-4">
              Du kan se spelarna i gruppen, men bara ägare och administratörer
              kan lägga till, redigera eller ta bort spelare.
            </p>
          )}

          {isLoading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Laddar spelare...</span>
            </div>
          )}

          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          {!isLoading && !errorMessage && players.length === 0 && (
            <Alert variant="info">Inga spelare finns i gruppen ännu.</Alert>
          )}

          {!isLoading && players.length > 0 && (
            <PlayersList
              players={players}
              canManage={canManage}
              onEditPlayer={setPlayerBeingEdited}
              onDeletePlayer={setPlayerBeingDeleted}
            />
          )}
        </Card.Body>
      </Card>

      {canManage && (
        <>
          <EditPlayerModal
            player={playerBeingEdited}
            isSaving={isSaving}
            onClose={() => setPlayerBeingEdited(null)}
            onSave={handleSavePlayer}
          />

          <DeletePlayerModal
            player={playerBeingDeleted}
            isDeleting={isDeleting}
            onClose={() => setPlayerBeingDeleted(null)}
            onConfirm={handleDeletePlayer}
          />
        </>
      )}
    </>
  );
}