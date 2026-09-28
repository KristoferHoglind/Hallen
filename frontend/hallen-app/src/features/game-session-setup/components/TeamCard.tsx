import { useState } from "react";
import { Badge, Button, Card, Form } from "react-bootstrap";
import type {
  GameSessionParticipant,
  GameSessionTeam,
} from "../types/gameSessionSetup";

type TeamCardProps = {
  title: string;
  teamId?: string;
  players: GameSessionParticipant[];
  teams: GameSessionTeam[];
  currentTeamId?: string;
  isUnassignedCard?: boolean;
  isSaving: boolean;
  onMovePlayer: (playerId: string, gameTeamId: string | null) => Promise<void>;
  onUpdateTeamName?: (gameTeamId: string, name: string) => Promise<void>;
  canManage: boolean;
};

export function TeamCard({
  title,
  teamId,
  players,
  teams,
  currentTeamId,
  isUnassignedCard = false,
  isSaving,
  onMovePlayer,
  onUpdateTeamName,
  canManage,
}: TeamCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

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

    await onUpdateTeamName(teamId, trimmedName);
    setIsEditingName(false);
  }

  return (
    <Card className="h-100">
      <Card.Body>
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
            <Card.Title className="h6 mb-0">{title}</Card.Title>
          )}

          <div className="d-flex align-items-center gap-2">
            {canManage && !isUnassignedCard && teamId && (
              <>
                {isEditingName ? (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isSaving}
                    aria-label="Spara lagnamn"
                  >
                    <i className="bi bi-check-lg" />
                  </Button>
                ) : (
                  <Button
                    variant="outline-secondary"
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
          <div className="d-flex flex-column gap-2">
            {players.map((player) => (
              <div
                key={player.playerId}
                className="border rounded p-2 d-flex flex-column gap-2"
              >
                <div className="fw-semibold">{player.playerName}</div>

                {canManage && (
                  <Form.Select
                    size="sm"
                    value={currentTeamId ?? ""}
                    disabled={isSaving}
                    onChange={(event) => {
                      const value = event.target.value;
                      onMovePlayer(
                        player.playerId,
                        value === "" ? null : value,
                      );
                    }}
                  >
                    <option value="">Ej placerad</option>

                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
