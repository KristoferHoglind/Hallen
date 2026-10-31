import { useMemo, useState } from "react";
import { Alert, Button, Col, Nav, Row, Spinner } from "react-bootstrap";
import { GameMatchesPanel } from "../../game-matches/components/GameMatchesPanel";
import { SetupSummaryCard } from "./SetupSummaryCard";
import { TeamCard } from "./TeamCard";
import { PlayerMoveMenu } from "./PlayerMoveMenu";
import type { GameSessionParticipant } from "../types/gameSessionSetup";
import { useGameSessionSetup } from "../hooks/useGameSessionSetup";

type GameSessionSetupPanelProps = {
  gameSessionId: string;
  canManage: boolean;
  onBack?: () => void;
};

export function GameSessionSetupPanel({
  gameSessionId,
  canManage,
  onBack,
}: GameSessionSetupPanelProps) {
  const [movingPlayer, setMovingPlayer] = useState<{
    player: GameSessionParticipant;
    target: HTMLButtonElement;
  } | null>(null);
  const [draggedPlayer, setDraggedPlayer] =
    useState<GameSessionParticipant | null>(null);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const [step, setStep] = useState("teams");
  const {
    setup,
    isLoading,
    isSaving,
    errorMessage,
    updateTeamName,
    randomizeSetupTeams,
    resetSetupPlayers,
    movePlayer,
  } = useGameSessionSetup(gameSessionId);

  async function handleMove(
    player: GameSessionParticipant,
    teamId: string | null,
  ) {
    if (isSaving || player.gameTeamId === teamId) return;
    const wasMoved = await movePlayer(player.playerId, teamId);
    if (wasMoved) {
      setMovingPlayer(null);
      setMoveAnnouncement(
        `${player.playerName} flyttades till ${setup?.teams.find((team) => team.id === teamId)?.name ?? "Ej placerade"}.`,
      );
      requestAnimationFrame(() =>
        document
          .getElementById(`team-roster-${teamId ?? "unassigned"}`)
          ?.focus(),
      );
    }
  }

  function handleDrop(teamId: string | null) {
    const player = draggedPlayer;
    setDraggedPlayer(null);
    if (player) void handleMove(player, teamId);
  }

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
      <div className="d-flex align-items-center gap-2 py-4">
        <Spinner animation="border" size="sm" />
        <span>Laddar laguppställning...</span>
      </div>
    );
  }

  return (
    <section className="setup-view">
      <div className="visually-hidden" role="status">
        {moveAnnouncement}
      </div>
      {movingPlayer && setup && (
        <PlayerMoveMenu
          player={movingPlayer.player}
          target={movingPlayer.target}
          teams={setup.teams}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onClose={() => {
            if (!isSaving) {
              const target = movingPlayer.target;
              setMovingPlayer(null);
              requestAnimationFrame(() => {
                if (target.isConnected) target.focus();
              });
            }
          }}
          onMove={(teamId) => handleMove(movingPlayer.player, teamId)}
        />
      )}

      <Nav
        variant="underline"
        className="workflow-steps mb-4"
        aria-label="Spelsessionens vyer"
      >
        <Nav.Item>
          <Nav.Link as="button" onClick={onBack} disabled={!onBack}>
            Spelsession
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={step === "teams"}
            aria-current={step === "teams" ? "location" : undefined}
            onClick={() => setStep("teams")}
            as="button"
          >
            Lag
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={step === "matches"}
            aria-current={step === "matches" ? "location" : undefined}
            disabled={!setup || setup.teams.length < 2 || isSaving}
            onClick={() => setStep("matches")}
            as="button"
          >
            Matcher
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={step === "results"}
            aria-current={step === "results" ? "location" : undefined}
            disabled={!setup || setup.teams.length < 2 || isSaving}
            onClick={() => setStep("results")}
            as="button"
          >
            Resultat
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <div hidden={step !== "teams"}>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h2 className="page-title mb-1">Laguppställning</h2>
            <div className="text-muted small">
              {canManage
                ? "Fördela spelarna mellan lagen och ändra lagnamn inför matcherna."
                : "Se hur spelarna är fördelade mellan lagen inför matcherna."}
            </div>
          </div>
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
          <Col>
            <SetupSummaryCard
              setup={setup}
              isSaving={isSaving}
              canManage={canManage}
              onRandomizeTeams={randomizeSetupTeams}
              onResetPlayers={resetSetupPlayers}
            />
          </Col>
        </Row>

        {setup && setup.teams.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-2">Lag</h6>
            {canManage && (
              <p className="text-muted small mb-3">
                Klicka på en spelare för att byta lag.
                <span className="d-none d-md-inline">
                  {" "}
                  Du kan också dra spelare mellan lagen.
                </span>
              </p>
            )}

            <Row className="g-3">
              {(unassignedParticipants.length > 0 || draggedPlayer) && (
                <Col md={4}>
                  <TeamCard
                    title="Ej placerade"
                    players={unassignedParticipants}
                    canManage={canManage}
                    onSelectPlayer={(player, target) =>
                      setMovingPlayer({ player, target })
                    }
                    onDragPlayer={setDraggedPlayer}
                    onDropPlayer={handleDrop}
                    draggedPlayer={draggedPlayer}
                    onUpdateTeamName={updateTeamName}
                    isSaving={isSaving}
                    isUnassignedCard
                  />
                </Col>
              )}

              {setup.teams.map((team) => (
                <Col md={4} key={team.id}>
                  <TeamCard
                    title={team.name}
                    players={team.players}
                    currentTeamId={team.id}
                    canManage={canManage}
                    onSelectPlayer={(player, target) =>
                      setMovingPlayer({ player, target })
                    }
                    onDragPlayer={setDraggedPlayer}
                    onDropPlayer={handleDrop}
                    draggedPlayer={draggedPlayer}
                    onUpdateTeamName={updateTeamName}
                    teamId={team.id}
                    isSaving={isSaving}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}

        <Button
          className="mt-4"
          disabled={!setup || setup.teams.length < 2 || isSaving}
          onClick={() => setStep("matches")}
        >
          Fortsätt till matcher{" "}
          <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
        </Button>
      </div>

      {(step === "matches" || step === "results") &&
        setup &&
        setup.teams.length >= 2 && (
          <GameMatchesPanel
            view={step === "results" ? "results" : "matches"}
            onEditRequest={() => setStep("matches")}
            gameSessionId={gameSessionId}
            teams={setup.teams}
            canManage={canManage}
          />
        )}
    </section>
  );
}
