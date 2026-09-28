import { Alert, Card } from "react-bootstrap";
import { GameSessionsPanel } from "../../game-sessions/components/GameSessionsPanel";
import type { SportsGroup } from "../types/sportsGroup";

type PlayTabProps = {
  selectedSportsGroup: SportsGroup | null;
};

export function PlayTab({ selectedSportsGroup }: PlayTabProps) {
  if (!selectedSportsGroup) {
    return (
      <Alert variant="info" className="mb-0">
        Gå till fliken Grupp och välj eller skapa en grupp först.
      </Alert>
    );
  }

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <div className="text-muted small mb-1">Aktiv grupp</div>
          <h2 className="h4 mb-0">{selectedSportsGroup.name}</h2>
        </Card.Body>
      </Card>

      <GameSessionsPanel
        sportsGroupId={selectedSportsGroup.id}
        canManage={selectedSportsGroup.canManage}
      />
    </>
  );
}