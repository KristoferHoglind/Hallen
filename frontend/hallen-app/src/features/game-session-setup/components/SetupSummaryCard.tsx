import { Badge, Button, Card } from "react-bootstrap";
import type { GameSessionSetup } from "../types/gameSessionSetup";

type SetupSummaryCardProps = {
  setup: GameSessionSetup | null;
  isSaving: boolean;
  onRandomizeTeams: () => void;
  canManage: boolean;
};

export function SetupSummaryCard({
  setup,
  isSaving,
  onRandomizeTeams,
  canManage,
}: SetupSummaryCardProps) {
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <Card.Title className="mb-1">Laguppställning</Card.Title>
            <div className="text-muted small">
              Deltagare och antal lag är låsta för det här speltillfället.
            </div>
          </div>

          {setup && (
            <div className="d-flex flex-column align-items-end gap-1">
              <Badge bg="secondary">
                {setup.participants.length} deltagare
              </Badge>
              <Badge bg="secondary">{setup.teams.length} lag</Badge>
            </div>
          )}
        </div>

        {canManage && (
          <Button
            variant="primary"
            onClick={onRandomizeTeams}
            disabled={isSaving || !setup || setup.teams.length < 2}
          >
            {isSaving ? "Slumpar..." : "Slumpa lag"}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}
