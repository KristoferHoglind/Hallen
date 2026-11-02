import { teamColor } from "../../../shared/utils/teamColor";
import { useRef, useState } from "react";
import { Badge, Button, Form } from "react-bootstrap";
import type { GameSessionParticipant } from "../types/gameSessionSetup";

type TeamCardProps = {
  title: string;
  teamId?: string;
  players: GameSessionParticipant[];
  isUnassignedCard?: boolean;
  isSaving: boolean;
  onUpdateTeamName?: (gameTeamId: string, name: string) => Promise<boolean>;
  canManage: boolean;
  selectionMode?: boolean;
  selectedPlayerIds?: string[];
  onTogglePlayer?: (playerId: string) => void;
};

export function TeamCard({
  title,
  teamId,
  players,
  isUnassignedCard = false,
  isSaving,
  onUpdateTeamName,
  canManage,
  selectionMode = false,
  selectedPlayerIds = [],
  onTogglePlayer,
}: TeamCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const isSavingName = useRef(false);
  async function handleSaveName() {
    if (!teamId || !onUpdateTeamName || isSavingName.current || isSaving) {
      return;
    }

    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      setNameInput(title);
      setIsEditingName(false);
      return;
    }

    if (trimmedName === title) {
      setIsEditingName(false);
      return;
    }

    isSavingName.current = true;
    try {
      const wasSaved = await onUpdateTeamName(teamId, trimmedName);
      if (wasSaved) {
        setIsEditingName(false);
      }
    } finally {
      isSavingName.current = false;
    }
  }

  return (
    <section
      id={`team-roster-${teamId ?? "unassigned"}`}
      tabIndex={-1}
      aria-label={title}
      className="team-roster h-100"
      style={{ borderTopColor: teamId ? teamColor(teamId) : "#94a3b8" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
        {isEditingName && teamId ? (
          <Form.Control
            size="sm"
            value={nameInput}
            disabled={isSaving}
            aria-label="Lagnamn"
            onChange={(event) => setNameInput(event.target.value)}
            onBlur={() => void handleSaveName()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSaveName();
              }

              if (event.key === "Escape") {
                setNameInput(title);
                setIsEditingName(false);
              }
            }}
            onFocus={(event) => event.currentTarget.select()}
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
                  onMouseDown={(event) => event.preventDefault()}
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
        <p className="text-muted small mb-0">Inga spelare här ännu.</p>
      ) : (
        <div className="roster-players">
          {players.map((player) =>
            canManage && selectionMode ? (
              <button
                key={player.playerId}
                type="button"
                className={`player-move-row ${selectionMode && selectedPlayerIds.includes(player.playerId) ? "bg-primary-subtle text-primary" : ""}`}
                disabled={isSaving}
                aria-label={`Markera ${player.playerName}`}
                aria-pressed={selectedPlayerIds.includes(player.playerId)}
                onClick={() => onTogglePlayer?.(player.playerId)}
              >
                <span>{player.playerName}</span>
                <i
                  className={`bi ${selectedPlayerIds.includes(player.playerId) ? "bi-check-square-fill" : "bi-square"}`}
                  aria-hidden="true"
                />
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
