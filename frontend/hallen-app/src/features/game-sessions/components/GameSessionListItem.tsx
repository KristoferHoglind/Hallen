import { Button, ButtonGroup } from "react-bootstrap";
import type { GameSession } from "../types/gameSession";
import { formatStartsAt } from "../utils/gameSessionDate";

type GameSessionListItemProps = {
  gameSession: GameSession;
  isSelected: boolean;
  canManage: boolean;
  onOpen: (gameSessionId: string) => void;
  onEdit: (gameSession: GameSession) => void;
  onDelete: (gameSession: GameSession) => void;
};

export function GameSessionListItem({
  gameSession,
  isSelected,
  canManage,
  onOpen,
  onEdit,
  onDelete,
}: GameSessionListItemProps) {
  return (
    <div className="list-group-item d-flex flex-column flex-md-row justify-content-between gap-3">
      <div className="d-flex flex-column gap-1">
        <div className="fw-semibold">{gameSession.name}</div>
        <small className="text-muted">
          {formatStartsAt(gameSession.startsAt)}
        </small>
      </div>

      <Button
        variant={isSelected ? "primary" : "outline-primary"}
        size="sm"
        onClick={() => onOpen(gameSession.id)}
      >
        Öppna
      </Button>

      {canManage && (
        <ButtonGroup size="sm" className="align-self-end ms-md-auto">
          <Button
            variant="outline-primary"
            aria-label={`Redigera ${gameSession.name}`}
            title="Redigera"
            onClick={() => onEdit(gameSession)}
          >
            <i className="bi bi-pencil" />
          </Button>

          <Button
            variant="outline-danger"
            aria-label={`Ta bort ${gameSession.name}`}
            title="Ta bort"
            onClick={() => onDelete(gameSession)}
          >
            <i className="bi bi-trash" />
          </Button>
        </ButtonGroup>
      )}
    </div>
  );
}