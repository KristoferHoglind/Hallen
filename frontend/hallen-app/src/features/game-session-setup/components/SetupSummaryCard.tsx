import { Button } from "react-bootstrap";
import type { GameSessionSetup } from "../types/gameSessionSetup";

type SetupSummaryCardProps = {
  setup: GameSessionSetup | null;
  isSaving: boolean;
  onRandomizeTeams: () => void;
  onResetPlayers: () => void;
  canManage: boolean;
};

export function SetupSummaryCard({
  setup,
  isSaving,
  onRandomizeTeams,
  onResetPlayers,
  canManage,
}: SetupSummaryCardProps) {
  return (
    <div className="setup-summary">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h3 className="h6 mb-1">Spelare och lag</h3>
          <div className="text-muted small">
            {canManage
              ? "Slumpa lag för att fördela spelarna automatiskt. Återställ spelare flyttar alla till Ej placerade."
              : "Här visas deltagarna och lagen för den här spelsessionen."}
          </div>
        </div>

        {setup && (
          <div className="d-flex flex-column align-items-end gap-1">
            <span className="text-muted small text-nowrap">
              {setup.participants.length} deltagare
            </span>
            <span className="text-muted small text-nowrap">
              {setup.teams.length} lag
            </span>
          </div>
        )}
      </div>

      {canManage && (
        <div className="d-flex flex-wrap gap-2">
          <Button
            variant="outline-secondary"
            onClick={onRandomizeTeams}
            disabled={isSaving || !setup || setup.teams.length < 2}
          >
            Slumpa lag
          </Button>
          <Button
            variant="outline-secondary"
            onClick={onResetPlayers}
            disabled={
              isSaving ||
              !setup ||
              !setup.teams.some((team) => team.players.length > 0)
            }
          >
            Återställ spelare
          </Button>
        </div>
      )}
    </div>
  );
}
