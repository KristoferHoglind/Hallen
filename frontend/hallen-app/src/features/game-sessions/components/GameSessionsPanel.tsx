import { useState } from "react";
import { Alert, Card, Spinner } from "react-bootstrap";
import { GameSessionSetupPanel } from "../../game-session-setup/components/GameSessionSetupPanel";
import { CreateGameSessionForm } from "./CreateGameSessionForm";
import { DeleteGameSessionModal } from "./DeleteGameSessionModal";
import { EditGameSessionModal } from "./EditGameSessionModal";
import { GameSessionsList } from "./GameSessionsList";
import { useGameSessions } from "../hooks/useGameSessions";
import type { GameSession } from "../types/gameSession";

type GameSessionsPanelProps = {
  sportsGroupId: string;
  canManage: boolean;
};

export function GameSessionsPanel({
  sportsGroupId,
  canManage,
}: GameSessionsPanelProps) {
  const {
    gameSessions,
    activePlayers,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    createGameSession,
    saveGameSession,
    removeGameSession,
  } = useGameSessions(sportsGroupId);

  const [selectedGameSessionId, setSelectedGameSessionId] = useState<
    string | null
  >(null);

  const [gameSessionBeingEdited, setGameSessionBeingEdited] =
    useState<GameSession | null>(null);

  const [gameSessionBeingDeleted, setGameSessionBeingDeleted] =
    useState<GameSession | null>(null);

  async function handleCreateGameSession(input: {
    name: string;
    startsAt: string;
    numberOfTeams: number;
    playerIds: string[];
  }) {
    await createGameSession(input);
  }

  async function handleSaveGameSession(input: {
    id: string;
    name: string;
    startsAt: string;
  }) {
    await saveGameSession(input);
    setGameSessionBeingEdited(null);
  }

  async function handleDeleteGameSession(gameSessionId: string) {
    await removeGameSession(gameSessionId);

    if (selectedGameSessionId === gameSessionId) {
      setSelectedGameSessionId(null);
    }

    setGameSessionBeingDeleted(null);
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Card.Title>Spelkvällar</Card.Title>

          {canManage && (
            <CreateGameSessionForm
              activePlayers={activePlayers}
              isSaving={isSaving}
              onCreateGameSession={handleCreateGameSession}
            />
          )}

          {!canManage && (
            <p className="text-muted mb-4">
              Du kan se spelkvällarna i gruppen, men bara ägare och
              administratörer kan skapa, redigera eller ta bort spelkvällar.
            </p>
          )}

          {isLoading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Laddar spelkvällar...</span>
            </div>
          )}

          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

          {!isLoading && !errorMessage && gameSessions.length === 0 && (
            <Alert variant="info">
              Inga spelkvällar finns för gruppen ännu.
            </Alert>
          )}

          {!isLoading && gameSessions.length > 0 && (
            <GameSessionsList
              gameSessions={gameSessions}
              selectedGameSessionId={selectedGameSessionId}
              canManage={canManage}
              onOpenGameSession={setSelectedGameSessionId}
              onEditGameSession={setGameSessionBeingEdited}
              onDeleteGameSession={setGameSessionBeingDeleted}
            />
          )}
        </Card.Body>
      </Card>

      {selectedGameSessionId && (
        <GameSessionSetupPanel
          gameSessionId={selectedGameSessionId}
          canManage={canManage}
        />
      )}

      {canManage && (
        <>
          <EditGameSessionModal
            gameSession={gameSessionBeingEdited}
            isSaving={isSaving}
            onClose={() => setGameSessionBeingEdited(null)}
            onSave={handleSaveGameSession}
          />

          <DeleteGameSessionModal
            gameSession={gameSessionBeingDeleted}
            isDeleting={isDeleting}
            onClose={() => setGameSessionBeingDeleted(null)}
            onConfirm={handleDeleteGameSession}
          />
        </>
      )}
    </>
  );
}