import type { GameSession } from "../types/gameSession";
import { GameSessionListItem } from "./GameSessionListItem";

type GameSessionsListProps = {
  gameSessions: GameSession[];
  selectedGameSessionId: string | null;
  canManage: boolean;
  onOpenGameSession: (gameSessionId: string) => void;
  onEditGameSession: (gameSession: GameSession) => void;
  onDeleteGameSession: (gameSession: GameSession) => void;
};

export function GameSessionsList({
  gameSessions,
  selectedGameSessionId,
  canManage,
  onOpenGameSession,
  onEditGameSession,
  onDeleteGameSession,
}: GameSessionsListProps) {
  return (
    <div className="list-group">
      {gameSessions.map((gameSession) => (
        <GameSessionListItem
          key={gameSession.id}
          gameSession={gameSession}
          isSelected={selectedGameSessionId === gameSession.id}
          canManage={canManage}
          onOpen={onOpenGameSession}
          onEdit={onEditGameSession}
          onDelete={onDeleteGameSession}
        />
      ))}
    </div>
  );
}