import { SessionTemplates } from "./SessionTemplates";
import type { SessionTemplate } from "../api/sessionTemplatesApi";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
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
    updateSessionStatus,
    updateParticipantCount,
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

  const [initialTemplate, setInitialTemplate] =
    useState<SessionTemplate | null>(null);
  const [showMissingPlayers, setShowMissingPlayers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGameSessionId, setSelectedGameSessionId] = useState<
    string | null
  >(null);

  const [gameSessionBeingEdited, setGameSessionBeingEdited] =
    useState<GameSession | null>(null);

  const [gameSessionBeingDeleted, setGameSessionBeingDeleted] =
    useState<GameSession | null>(null);

  async function handleCreateGameSession(input: {
    teamNames?: string[];
    name: string;
    startsAt: string;
    numberOfTeams: number;
    playerIds: string[];
  }) {
    const created = await createGameSession(input);
    if (created) {
      setIsCreating(false);
      setSelectedGameSessionId(created.id);
    }
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
      {!selectedGameSessionId && (
        <Card className="plain-section">
          <Card.Body>
            <h2 className="page-title mb-4">
              {isCreating ? "Ny spelsession" : "Spelsessioner"}
            </h2>

            {canManage && !isCreating && (
              <Button
                className="mb-3"
                disabled={isLoading || Boolean(errorMessage)}
                onClick={() => {
                  if (activePlayers.length === 0) {
                    setShowMissingPlayers(true);
                    return;
                  }
                  setShowMissingPlayers(false);
                  setInitialTemplate(null);
                  setIsCreating(true);
                }}
              >
                Ny spelsession
              </Button>
            )}
            {canManage && showMissingPlayers && activePlayers.length === 0 && (
              <Alert variant="warning">
                Gruppen saknar aktiva spelare. Lägg till eller aktivera spelare
                innan du skapar en spelsession.{" "}
                <Alert.Link
                  as={Link}
                  to={`/grupper?grupp=${encodeURIComponent(sportsGroupId)}`}
                >
                  Hantera gruppens spelare
                </Alert.Link>
              </Alert>
            )}
            {canManage && !isCreating && !isLoading && (
              <SessionTemplates
                groupId={sportsGroupId}
                onUse={(template) => {
                  if (!activePlayers.length) {
                    setShowMissingPlayers(true);
                    return;
                  }
                  setInitialTemplate(template);
                  setShowMissingPlayers(false);
                  setIsCreating(true);
                }}
              />
            )}
            {canManage && isCreating && (
              <>
                <Button
                  variant="outline-secondary"
                  className="btn-navigation mb-3"
                  disabled={isSaving}
                  onClick={() => setIsCreating(false)}
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                  Till spelsessioner
                </Button>
                <CreateGameSessionForm
                  initialTemplate={initialTemplate}
                  activePlayers={activePlayers}
                  isSaving={isSaving}
                  onCreateGameSession={handleCreateGameSession}
                />
              </>
            )}

            {!canManage && (
              <p className="text-muted mb-4">
                Du kan se spelsessionerna i gruppen, men bara ägare och
                administratörer kan skapa, redigera eller ta bort spelsessioner.
              </p>
            )}

            {isLoading && (
              <div className="d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" />
                <span>Laddar spelsessioner...</span>
              </div>
            )}

            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

            {!isCreating &&
              !isLoading &&
              !errorMessage &&
              gameSessions.length === 0 && (
                <Alert variant="info">
                  Inga spelsessioner finns för gruppen ännu.
                </Alert>
              )}

            {!isCreating && !isLoading && gameSessions.length > 0 && (
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
      )}

      {selectedGameSessionId && (
        <>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <Button
              variant="outline-secondary"
              className="btn-navigation"
              onClick={() => setSelectedGameSessionId(null)}
            >
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Till spelsessioner
            </Button>
            <span className="fw-semibold">
              {
                gameSessions.find(
                  (session) => session.id === selectedGameSessionId,
                )?.name
              }
            </span>
          </div>
          {canManage && (
            <SessionTemplates
              key={selectedGameSessionId}
              groupId={sportsGroupId}
              source={gameSessions.find((s) => s.id === selectedGameSessionId)}
            />
          )}
          <GameSessionSetupPanel
            onBack={() => setSelectedGameSessionId(null)}
            key={selectedGameSessionId}
            onStatusChanged={(closed) =>
              updateSessionStatus(selectedGameSessionId, closed)
            }
            onParticipantsChanged={(count) =>
              updateParticipantCount(selectedGameSessionId, count)
            }
            gameSessionId={selectedGameSessionId}
            canManage={canManage}
          />
        </>
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
