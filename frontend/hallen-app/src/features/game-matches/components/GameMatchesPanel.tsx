import { useMemo, useState } from "react";
import { Alert, Badge, Card, Spinner } from "react-bootstrap";
import type { GameMatch } from "../types/gameMatch";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import { CurrentMatchCard } from "./CurrentMatchCard";
import { MatchHistoryAccordion } from "./MatchHistoryAccordion";
import { MatchStatsTable } from "./MatchStatsTable";
import { buildGameMatchStandings } from "../utils/gameMatchStandings";
import { MatchPagination } from "./MatchPagination";
import { DeleteMatchModal } from "./DeleteMatchModal";
import { useGameMatches } from "../hooks/useGameMatches";
import { useMatchForm } from "../hooks/useMatchForm";
import { usePagination } from "../../../shared/hooks/usePagination";

type GameMatchesPanelProps = {
  gameSessionId: string;
  teams: GameSessionTeam[];
  canManage: boolean;
};

export function GameMatchesPanel({
  gameSessionId,
  teams,
  canManage,
}: GameMatchesPanelProps) {
  const {
    matches,
    isLoading,
    isSaving,
    errorMessage,
    setErrorMessage,
    createMatch,
    updateMatch,
    deleteMatch,
  } = useGameMatches(gameSessionId);

  const {
    sortedTeams,
    scoreInputs,
    editingMatchId,
    matchNameInput,
    setMatchNameInput,
    updateScoreInput,
    adjustScoreInput,
    resetForm,
    startEdit,
    buildRequest,
  } = useMatchForm(teams);

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

  const standings = useMemo(() => {
    return buildGameMatchStandings(matches, sortedTeams);
  }, [matches, sortedTeams]);

  async function handleSubmit() {
    if (!hasEnoughTeams) {
      setErrorMessage("Det behövs minst två lag för att spara en match.");
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
      <Card className="mt-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <Card.Title className="mb-1">Matcher & resultat</Card.Title>
              <div className="text-muted small">
                {canManage
                  ? "Registrera resultat för lagen i den här spelkvällen."
                  : "Visa matcher och resultat för lagen i den här spelkvällen."}
              </div>
            </div>

            <Badge bg="secondary">{matches.length} matcher</Badge>
          </div>

          {canManage && hasEnoughTeams && (
            <CurrentMatchCard
              teams={sortedTeams}
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

          <MatchStatsTable standings={standings} />

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
              onEditMatch={startEdit}
              onDeleteMatch={setMatchToDelete}
            />
          )}

          <MatchPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChangePage={goToPage}
          />

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
        </Card.Body>
      </Card>

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
