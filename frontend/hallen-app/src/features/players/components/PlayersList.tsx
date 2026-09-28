import type { Player } from "../types/player";
import { PlayerListItem } from "./PlayerListItem";

type PlayersListProps = {
  players: Player[];
  canManage: boolean;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (player: Player) => void;
};

export function PlayersList({
  players,
  canManage,
  onEditPlayer,
  onDeletePlayer,
}: PlayersListProps) {
  return (
    <div className="list-group">
      {players.map((player) => (
        <PlayerListItem
          key={player.id}
          player={player}
          canManage={canManage}
          onEditPlayer={onEditPlayer}
          onDeletePlayer={onDeletePlayer}
        />
      ))}
    </div>
  );
}