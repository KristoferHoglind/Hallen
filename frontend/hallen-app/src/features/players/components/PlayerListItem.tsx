import { Button, ButtonGroup } from "react-bootstrap";
import type { Player } from "../types/player";

type PlayerListItemProps = {
  player: Player;
  canManage: boolean;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (player: Player) => void;
};

export function PlayerListItem({
  player,
  canManage,
  onEditPlayer,
  onDeletePlayer,
}: PlayerListItemProps) {
  return (
    <div
      className={`list-group-item d-flex flex-column flex-md-row justify-content-between gap-3 ${
        !player.isActive ? "bg-light text-muted opacity-75" : ""
      }`}
    >
      <div className="d-flex flex-column align-items-start gap-1">
        <div className="fw-semibold">{player.name}</div>

        <span
          className={`badge ${
            player.isActive ? "text-bg-success" : "text-bg-secondary"
          }`}
        >
          {player.isActive ? "Aktiv" : "Inaktiv"}
        </span>
      </div>

      {canManage && (
        <ButtonGroup size="sm" className="align-self-end">
          <Button
            variant="outline-primary"
            aria-label={`Redigera ${player.name}`}
            title="Redigera"
            onClick={() => onEditPlayer(player)}
          >
            <i className="bi bi-pencil" />
          </Button>

          <Button
            variant="outline-danger"
            aria-label={`Ta bort ${player.name}`}
            title="Ta bort"
            onClick={() => onDeletePlayer(player)}
          >
            <i className="bi bi-trash" />
          </Button>
        </ButtonGroup>
      )}
    </div>
  );
}