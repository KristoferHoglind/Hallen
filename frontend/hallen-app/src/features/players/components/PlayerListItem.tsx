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
      className={`list-group-item compact-player d-flex align-items-center justify-content-between gap-2 ${
        !player.isActive ? "bg-light text-muted opacity-75" : ""
      }`}
    >
      <div className="d-flex flex-wrap align-items-center gap-2">
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
        <ButtonGroup size="sm" className="flex-shrink-0">
          <Button
            variant="link"
            aria-label={`Redigera ${player.name}`}
            title="Redigera"
            onClick={() => onEditPlayer(player)}
          >
            <i className="bi bi-pencil" />
          </Button>

          <Button
            variant="link"
            className="text-danger"
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
