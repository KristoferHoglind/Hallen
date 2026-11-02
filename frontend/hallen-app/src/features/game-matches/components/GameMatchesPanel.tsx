import { useMemo, useState } from "react";
import { Alert, Badge, Spinner } from "react-bootstrap";
import type { GameMatch } from "../types/gameMatch";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import { CurrentMatchCard } from "./CurrentMatchCard";
import { MatchHistoryAccordion } from "./MatchHistoryAccordion";
import { MatchResultsSummary } from "./MatchResultsSummary";
import { MatchPagination } from "./MatchPagination";
import { DeleteMatchModal } from "./DeleteMatchModal";
import { useGameMatches } from "../hooks/useGameMatches";
import { useMatchForm } from "../hooks/useMatchForm";
import { usePagination } from "../../../shared/hooks/usePagination";

type GameMatchesPanelProps = {
  gameSessionId: string;
  teams: GameSessionTeam[];
  canManage: boolean;
  view?: "matches" | "results";
  onEditRequest?: () => void;
};

export function GameMatchesPanel({
  gameSessionId,
  teams,
  canManage,
  view = "matches",
  onEditRequest,
}: GameMatchesPanelProps) {
  const {
    matches: savedMatches,
    isLoading,
    isSaving,
    errorMessage,
    setErrorMessage,
    createMatch,
    updateMatch,
    deleteMatch,
  } = useGameMatches(gameSessionId);

  const matches = useMemo(() => {
    const teamNames = new Map(teams.map((team) => [team.id, team.name]));
    return savedMatches.map((match) => ({
      ...match,
      teamResults: match.teamResults.map((result) => ({
        ...result,
        gameTeamName: teamNames.get(result.gameTeamId) ?? result.gameTeamName,
      })),
    }));
  }, [savedMatches, teams]);

  const {
    sortedTeams,
    isDraw,
    winnerGameTeamId,
    setWinnerGameTeamId,
    matchTeams,
    toggleTeam,
    scoreInputs,
    editingMatchId,
    matchNameInput,
    setMatchNameInput,
    updateScoreInput,
    adjustScoreInput,
    resetForm,
    startEdit,
    buildRequest,
  } = useMatchForm(teams, matches);

  const {
    currentPage,
    totalPages,
    pagedItems: pagedMatches,
    goToPage,
    goToFirstPage,
  } = usePagination({
    items: matches,
    pageSize: 10,
  });

  const [matchToDelete, setMatchToDelete] = useState<GameMatch | null>(null);

  const hasEnoughTeams = teams.length >= 2;

  async function handleSubmit() {
    if (matchTeams.length !== 2) {
      setErrorMessage("Välj exakt två lag som möter varandra.");
      return;
    }

    const request = buildRequest();

    const savedMatch =
      editingMatchId !== null
        ? await updateMatch(editingMatchId, request)
        : await createMatch(request);

    if (!savedMatch) {
      return;
    }

    goToFirstPage();
    resetForm();
  }

  async function confirmDeleteMatch() {
    if (!matchToDelete) {
      return;
    }

    const wasDeleted = await deleteMatch(matchToDelete.id);

    if (!wasDeleted) {
      return;
    }

    if (editingMatchId === matchToDelete.id) {
      resetForm();
    }

    goToFirstPage();
    setMatchToDelete(null);
  }

  return (
    <>
      <section className="matches-view">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h2 className="page-title mb-1">
              {view === "results" ? "Resultat & sammanställning" : "Matcher"}
            </h2>
            <div className="text-muted small">
              {view === "results"
                ? "Se tabellen och höjdpunkterna från hela spelsessionen."
                : canManage
                  ? "Registrera resultat och se tidigare matcher i spelsessionen."
                  : "Se de spelade matcherna i den här spelsessionen."}
            </div>
          </div>

          <Badge bg="secondary">{matches.length} matcher</Badge>
        </div>

        <div hidden={view !== "matches"}>
          {canManage && hasEnoughTeams && !isLoading && (
            <CurrentMatchCard
              teams={sortedTeams}
              isDraw={isDraw}
              winnerGameTeamId={winnerGameTeamId}
              onChangeWinner={setWinnerGameTeamId}
              matchTeams={matchTeams}
              onToggleTeam={toggleTeam}
              scoreInputs={scoreInputs}
              editingMatchId={editingMatchId}
              matchNameInput={matchNameInput}
              isSaving={isSaving}
              onChangeMatchName={setMatchNameInput}
              onUpdateScoreInput={updateScoreInput}
              onAdjustScoreInput={adjustScoreInput}
              onSubmit={handleSubmit}
              onCancelEdit={resetForm}
            />
          )}

          <h3 className="h5 mt-5 mb-3">Spelade matcher</h3>
          {isLoading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Laddar matcher...</span>
            </div>
          ) : matches.length === 0 ? (
            <p className="text-muted mb-4">
              Inga matcher är registrerade ännu.
            </p>
          ) : (
            <MatchHistoryAccordion
              matches={pagedMatches}
              isSaving={isSaving}
              canManage={canManage}
              onEditMatch={(match) => {
                startEdit(match);
                onEditRequest?.();
                requestAnimationFrame(() => {
                  const input = document.getElementById("currentMatchName");
                  if (input instanceof HTMLInputElement) {
                    input.focus();
                    input.select();
                  }
                });
              }}
              onDeleteMatch={setMatchToDelete}
            />
          )}

          <MatchPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChangePage={goToPage}
          />
        </div>
        <div hidden={view !== "results"}>
          <MatchResultsSummary
            matches={matches}
            teams={sortedTeams}
            isLoading={isLoading}
          />
        </div>
        {errorMessage && (
          <Alert variant="danger" className="mb-3">
            {errorMessage}
          </Alert>
        )}

        {!hasEnoughTeams && (
          <Alert variant="warning" className="mb-3">
            Skapa minst två lag innan du registrerar matcher.
          </Alert>
        )}
      </section>

      {canManage && (
        <DeleteMatchModal
          match={matchToDelete}
          isSaving={isSaving}
          onCancel={() => setMatchToDelete(null)}
          onConfirm={confirmDeleteMatch}
        />
      )}
    </>
  );
}
