import { useMemo } from "react";
import { Alert, Badge, Card, Col, Row, Spinner } from "react-bootstrap";
import { GameMatchesPanel } from "../../game-matches/components/GameMatchesPanel";
import { SetupSummaryCard } from "./SetupSummaryCard";
import { TeamCard } from "./TeamCard";
import { useGameSessionSetup } from "../hooks/useGameSessionSetup";

type GameSessionSetupPanelProps = {
  gameSessionId: string;
  canManage: boolean;
};

export function GameSessionSetupPanel({
  gameSessionId,
  canManage,
}: GameSessionSetupPanelProps) {
  const {
    setup,
    isLoading,
    isSaving,
    errorMessage,
    updateTeamName,
    randomizeSetupTeams,
    movePlayer,
  } = useGameSessionSetup(gameSessionId);

  const unassignedParticipants = useMemo(() => {
    if (!setup) {
      return [];
    }

    return setup.participants.filter(
      (participant) => !participant.isAssignedToTeam,
    );
  }, [setup]);

  if (isLoading) {
    return (
      <Card className="mt-3">
        <Card.Body className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Laddar laguppställning...</span>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <Card.Title className="mb-1">Laguppställning</Card.Title>
            <div className="text-muted small">
              {canManage
                ? "Hantera lag och spelare för det här speltillfället."
                : "Visa lag och spelare för det här speltillfället."}
            </div>
          </div>

          {setup && setup.teams.length > 0 && (
            <Badge bg="secondary">{setup.teams.length} lag</Badge>
          )}
        </div>

        {!canManage && (
          <Alert variant="secondary" className="mb-3">
            Du kan se laguppställningen, men bara ägare och administratörer kan
            ändra lag eller flytta spelare.
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="danger" className="mb-3">
            {errorMessage}
          </Alert>
        )}

        <Row className="g-3">
          <Col md={5}>
            <SetupSummaryCard
              setup={setup}
              isSaving={isSaving}
              canManage={canManage}
              onRandomizeTeams={randomizeSetupTeams}
            />
          </Col>
        </Row>

        {setup && setup.teams.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">Lag</h6>

            <Row className="g-3">
              <Col md={4}>
                <TeamCard
                  title="Ej placerade"
                  players={unassignedParticipants}
                  teams={setup.teams}
                  canManage={canManage}
                  onMovePlayer={movePlayer}
                  onUpdateTeamName={updateTeamName}
                  isSaving={isSaving}
                  isUnassignedCard
                />
              </Col>

              {setup.teams.map((team) => (
                <Col md={4} key={team.id}>
                  <TeamCard
                    title={team.name}
                    players={team.players}
                    teams={setup.teams}
                    currentTeamId={team.id}
                    canManage={canManage}
                    onMovePlayer={movePlayer}
                    onUpdateTeamName={updateTeamName}
                    teamId={team.id}
                    isSaving={isSaving}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}

        {setup && setup.teams.length >= 2 && (
          <GameMatchesPanel
            gameSessionId={gameSessionId}
            teams={setup.teams}
            canManage={canManage}
          />
        )}
      </Card.Body>
    </Card>
  );
}