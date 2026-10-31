import { teamColor } from "../../../shared/utils/teamColor";
import { useEffect, useState } from "react";
import { Badge, Button, Form } from "react-bootstrap";
import type { GameSessionParticipant } from "../types/gameSessionSetup";

type TeamCardProps = {
  title: string;
  teamId?: string;
  players: GameSessionParticipant[];
  currentTeamId?: string;
  isUnassignedCard?: boolean;
  isSaving: boolean;
  onSelectPlayer: (
    player: GameSessionParticipant,
    target: HTMLButtonElement,
  ) => void;
  onDragPlayer: (player: GameSessionParticipant | null) => void;
  onDropPlayer: (gameTeamId: string | null) => void;
  draggedPlayer: GameSessionParticipant | null;
  onUpdateTeamName?: (gameTeamId: string, name: string) => Promise<boolean>;
  canManage: boolean;
};

export function TeamCard({
  title,
  teamId,
  players,
  currentTeamId,
  isUnassignedCard = false,
  isSaving,
  onSelectPlayer,
  onDragPlayer,
  onDropPlayer,
  draggedPlayer,
  onUpdateTeamName,
  canManage,
}: TeamCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  useEffect(() => {
    const clearDrag = () => setIsDragOver(false);
    document.addEventListener("dragend", clearDrag);
    return () => document.removeEventListener("dragend", clearDrag);
  }, []);

  async function handleSaveName() {
    if (!teamId || !onUpdateTeamName) {
      return;
    }

    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      setNameInput(title);
      setIsEditingName(false);
      return;
    }

    const wasSaved = await onUpdateTeamName(teamId, trimmedName);
    if (wasSaved) {
      setIsEditingName(false);
    }
  }

  return (
    <section
      id={`team-roster-${teamId ?? "unassigned"}`}
      tabIndex={-1}
      aria-label={title}
      className={`team-roster h-100 ${isDragOver && draggedPlayer ? "is-drop-target" : ""}`}
      onDragOver={(event) => {
        if (
          !canManage ||
          isSaving ||
          !draggedPlayer ||
          draggedPlayer.gameTeamId === (currentTeamId ?? null)
        )
          return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setIsDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        if (
          canManage &&
          !isSaving &&
          draggedPlayer &&
          draggedPlayer.gameTeamId !== (currentTeamId ?? null)
        )
          onDropPlayer(currentTeamId ?? null);
      }}
      style={{ borderTopColor: teamId ? teamColor(teamId) : "#94a3b8" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
        {isEditingName && teamId ? (
          <Form.Control
            size="sm"
            value={nameInput}
            disabled={isSaving}
            onChange={(event) => setNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSaveName();
              }

              if (event.key === "Escape") {
                setNameInput(title);
                setIsEditingName(false);
              }
            }}
            autoFocus
          />
        ) : (
          <h3 className="h5 mb-0">{title}</h3>
        )}

        <div className="d-flex align-items-center gap-2">
          {canManage && !isUnassignedCard && teamId && (
            <>
              {isEditingName ? (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleSaveName}
                  disabled={isSaving}
                  aria-label="Spara lagnamn"
                >
                  <i className="bi bi-check-lg" />
                </Button>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setNameInput(title);
                    setIsEditingName(true);
                  }}
                  disabled={isSaving}
                  aria-label="Redigera lagnamn"
                >
                  <i className="bi bi-pencil" />
                </Button>
              )}
            </>
          )}

          <Badge bg={isUnassignedCard ? "secondary" : "primary"}>
            {players.length}
          </Badge>
        </div>
      </div>

      {players.length === 0 ? (
        <p className="text-muted small mb-0">
          {draggedPlayer ? "Släpp spelaren här" : "Inga spelare här ännu."}
        </p>
      ) : (
        <div className="roster-players">
          {players.map((player) =>
            canManage ? (
              <button
                key={player.playerId}
                type="button"
                className="player-move-row"
                disabled={isSaving}
                draggable={!isSaving}
                aria-label={`Flytta ${player.playerName}`}
                aria-haspopup="dialog"
                onClick={(event) => onSelectPlayer(player, event.currentTarget)}
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    "application/x-hallen-player",
                    player.playerId,
                  );
                  event.dataTransfer.effectAllowed = "move";
                  onDragPlayer(player);
                }}
                onDragEnd={() => {
                  setIsDragOver(false);
                  onDragPlayer(null);
                }}
              >
                <span>{player.playerName}</span>
                <i className="bi bi-arrow-left-right" aria-hidden="true" />
              </button>
            ) : (
              <div className="player-row" key={player.playerId}>
                {player.playerName}
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}
