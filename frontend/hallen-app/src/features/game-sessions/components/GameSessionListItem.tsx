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
        <button
          type="button"
          className="session-title"
          aria-current={isSelected ? "true" : undefined}
          onClick={() => onOpen(gameSession.id)}
        >
          {gameSession.name}
          <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
        </button>
        {gameSession.isClosed && (
          <span className="small text-muted">
            <i className="bi bi-lock-fill me-1" aria-hidden="true" />
            Avslutad
          </span>
        )}
        <small className="text-muted">
          {formatStartsAt(gameSession.startsAt)}
        </small>
      </div>

      {canManage && !gameSession.isClosed && (
        <ButtonGroup size="sm" className="align-self-end ms-md-auto">
          <Button
            variant="link"
            aria-label={`Redigera ${gameSession.name}`}
            title="Redigera"
            onClick={() => onEdit(gameSession)}
          >
            <i className="bi bi-pencil" />
          </Button>

          <Button
            variant="link"
            className="text-danger"
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
