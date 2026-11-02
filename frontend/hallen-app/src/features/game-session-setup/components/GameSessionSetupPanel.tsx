import { useMemo, useState } from "react";
import { Alert, Button, Col, Nav, Row, Spinner } from "react-bootstrap";
import { teamColor } from "../../../shared/utils/teamColor";
import { GameMatchesPanel } from "../../game-matches/components/GameMatchesPanel";
import { EditSessionPlayersModal } from "./EditSessionPlayersModal";
import { SetupSummaryCard } from "./SetupSummaryCard";
import { TeamCard } from "./TeamCard";
import { useGameSessionSetup } from "../hooks/useGameSessionSetup";

type GameSessionSetupPanelProps = {
  gameSessionId: string;
  canManage: boolean;
  onBack?: () => void;
  onParticipantsChanged?: (count: number) => void;
};

export function GameSessionSetupPanel({
  gameSessionId,
  canManage,
  onBack,
  onParticipantsChanged,
}: GameSessionSetupPanelProps) {
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const [editingParticipants, setEditingParticipants] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [step, setStep] = useState("teams");
  const {
    setup,
    isLoading,
    isSaving,
    errorMessage,
    updateTeamName,
    updateParticipants,
    randomizeSetupTeams,
    resetSetupPlayers,
    movePlayers,
  } = useGameSessionSetup(gameSessionId);

  const selectedParticipants =
    setup?.participants.filter((player) =>
      selectedPlayerIds.includes(player.playerId),
    ) ?? [];

  function toggleSelectedPlayer(playerId: string) {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  }

  async function handleMoveSelected(teamId: string | null) {
    if (isSaving || !selectedParticipants.length) return;
    const count = selectedParticipants.length;
    if (
      await movePlayers(
        selectedParticipants.map((player) => player.playerId),
        teamId,
      )
    ) {
      setSelectedPlayerIds([]);
      setMoveAnnouncement(
        `${count} spelare flyttades till ${setup?.teams.find((team) => team.id === teamId)?.name ?? "Ej placerade"}.`,
      );
      requestAnimationFrame(() =>
        document
          .getElementById(`team-roster-${teamId ?? "unassigned"}`)
          ?.focus(),
      );
    }
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
      {editingParticipants && setup && canManage && (
        <EditSessionPlayersModal
          sportsGroupId={setup.sportsGroupId}
          participants={setup.participants}
          isSaving={isSaving}
          onClose={() => setEditingParticipants(false)}
          onSave={async (playerIds) => {
            const saved = await updateParticipants(playerIds);
            if (saved) {
              onParticipantsChanged?.(playerIds.length);
              setSelectedPlayerIds((current) =>
                current.filter((id) => playerIds.includes(id)),
              );
            }
            return saved;
          }}
        />
      )}
      <div className="visually-hidden" role="status">
        {moveAnnouncement}
      </div>
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

        {canManage && setup && (
          <Button
            variant="outline-primary"
            className="mb-3"
            disabled={isSaving}
            onClick={() => setEditingParticipants(true)}
          >
            <i className="bi bi-person-plus me-2" aria-hidden="true" />
            Ändra deltagare
          </Button>
        )}

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
              <div className="mb-3">
                <Button
                  variant={selectionMode ? "primary" : "outline-primary"}
                  disabled={isSaving}
                  aria-pressed={selectionMode}
                  onClick={() => {
                    setSelectionMode((current) => !current);
                    setSelectedPlayerIds([]);
                  }}
                >
                  <i className="bi bi-ui-checks me-2" aria-hidden="true" />
                  {selectionMode ? "Avsluta markering" : "Markera spelare"}
                </Button>
                <p className="text-muted small mt-2 mb-0">
                  {selectionMode
                    ? "Markera spelarna du vill flytta och välj sedan ett lag."
                    : "Välj Markera spelare för att flytta en eller flera spelare till ett lag."}
                </p>
              </div>
            )}

            {canManage && selectionMode && (
              <div
                className="mb-3"
                role="group"
                aria-label="Flytta markerade spelare"
              >
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <strong aria-live="polite">
                    {selectedParticipants.length} markerade
                  </strong>
                  <Button
                    variant="link"
                    size="sm"
                    disabled={isSaving || !setup.participants.length}
                    onClick={() =>
                      setSelectedPlayerIds(
                        setup.participants.map((player) => player.playerId),
                      )
                    }
                  >
                    Markera alla
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    disabled={isSaving || !selectedParticipants.length}
                    onClick={() => setSelectedPlayerIds([])}
                  >
                    Avmarkera alla
                  </Button>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="small text-muted">Flytta till:</span>
                  {[...setup.teams, { id: null, name: "Ej placerade" }].map(
                    (team) => (
                      <Button
                        key={team.id ?? "unassigned"}
                        variant="outline-primary"
                        disabled={
                          isSaving ||
                          !selectedParticipants.some(
                            (player) => player.gameTeamId !== team.id,
                          )
                        }
                        onClick={() => void handleMoveSelected(team.id)}
                      >
                        <span
                          className="team-dot me-2"
                          style={{
                            background: team.id
                              ? teamColor(team.id)
                              : "#94a3b8",
                          }}
                          aria-hidden="true"
                        />
                        {team.name}
                      </Button>
                    ),
                  )}
                </div>
                {isSaving && (
                  <p role="status" className="small text-muted mt-2">
                    Sparar ändringar…
                  </p>
                )}
              </div>
            )}

            <Row className="g-3">
              {unassignedParticipants.length > 0 && (
                <Col md={4}>
                  <TeamCard
                    title="Ej placerade"
                    players={unassignedParticipants}
                    canManage={canManage}
                    selectionMode={selectionMode}
                    selectedPlayerIds={selectedPlayerIds}
                    onTogglePlayer={toggleSelectedPlayer}
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
                    canManage={canManage}
                    selectionMode={selectionMode}
                    selectedPlayerIds={selectedPlayerIds}
                    onTogglePlayer={toggleSelectedPlayer}
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
