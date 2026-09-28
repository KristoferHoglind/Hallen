import { Button, Card, Col, Form, Row } from "react-bootstrap";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import { TeamScoreControl } from "./TeamScoreControl";

type ScoreInput = {
  gameTeamId: string;
  score: number;
};

type CurrentMatchCardProps = {
  teams: GameSessionTeam[];
  scoreInputs: ScoreInput[];
  editingMatchId: string | null;
  matchNameInput: string;
  isSaving: boolean;
  onChangeMatchName: (name: string) => void;
  onUpdateScoreInput: (gameTeamId: string, score: number) => void;
  onAdjustScoreInput: (gameTeamId: string, delta: number) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export function CurrentMatchCard({
  teams,
  scoreInputs,
  editingMatchId,
  matchNameInput,
  isSaving,
  onChangeMatchName,
  onUpdateScoreInput,
  onAdjustScoreInput,
  onSubmit,
  onCancelEdit,
}: CurrentMatchCardProps) {
  function getScore(gameTeamId: string) {
    return (
      scoreInputs.find((scoreInput) => scoreInput.gameTeamId === gameTeamId)
        ?.score ?? 0
    );
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title className="h5 mb-1">
          {editingMatchId !== null ? "Redigera match" : "Pågående match"}
        </Card.Title>

        <div className="text-muted small mb-3">
          {editingMatchId !== null
            ? "Uppdatera resultatet för den valda matchen."
            : "Använd plus och minus under matchen och spara när matchen är klar."}
        </div>

        <Form.Group className="mb-3">
          <Form.Label className="small text-muted">
            Matchnamn, valfritt
          </Form.Label>
          <Form.Control
            type="text"
            value={matchNameInput}
            maxLength={200}
            disabled={isSaving}
            onChange={(event) => onChangeMatchName(event.target.value)}
            placeholder="Match"
          />
        </Form.Group>

        <Row className="g-3">
          {teams.map((team) => {
            const score = getScore(team.id);

            return (
              <Col xs={12} md={6} xl={4} key={team.id}>
                <TeamScoreControl
                  teamName={team.name}
                  playerCount={team.players.length}
                  score={score}
                  disabled={isSaving}
                  onDecrease={() => onAdjustScoreInput(team.id, -1)}
                  onIncrease={() => onAdjustScoreInput(team.id, 1)}
                  onChangeScore={(newScore) =>
                    onUpdateScoreInput(team.id, newScore)
                  }
                />
              </Col>
            );
          })}
        </Row>

        <div className="d-grid gap-2 d-md-flex mt-3">
          <Button variant="primary" onClick={onSubmit} disabled={isSaving}>
            {isSaving
              ? "Sparar..."
              : editingMatchId !== null
                ? "Spara ändringar"
                : "Spara match"}
          </Button>

          {editingMatchId !== null && (
            <Button
              variant="outline-secondary"
              size="lg"
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              Avbryt
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}