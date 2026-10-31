import { teamColor } from "../../../shared/utils/teamColor";
import { Button, Form } from "react-bootstrap";
import type { GameSessionTeam } from "../../game-session-setup/types/gameSessionSetup";
import { TeamScoreControl } from "./TeamScoreControl";

type ScoreInput = {
  gameTeamId: string;
  score: number;
};

type CurrentMatchCardProps = {
  teams: GameSessionTeam[];
  isDraw: boolean;
  winnerGameTeamId: string | null;
  onChangeWinner: (gameTeamId: string | null) => void;
  matchTeams: GameSessionTeam[];
  onToggleTeam: (gameTeamId: string) => void;
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
  isDraw,
  winnerGameTeamId,
  onChangeWinner,
  matchTeams,
  onToggleTeam,
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
    <section className="current-match mb-5" aria-label="Aktuell match">
      <h3 className="section-eyebrow mb-2">
        {editingMatchId !== null ? "Redigera match" : "Pågående match"}
      </h3>

      <div className="text-muted small mb-3">
        {editingMatchId !== null
          ? "Uppdatera resultatet för den valda matchen."
          : "Använd plus och minus under matchen och spara när matchen är klar."}
      </div>

      <Form.Group className="match-name mb-4" controlId="currentMatchName">
        <Form.Label className="small text-muted">
          Matchnamn – klicka för att ändra
        </Form.Label>
        <div className="match-name-editor">
          <Form.Control
            className="match-name-input"
            type="text"
            value={matchNameInput}
            maxLength={200}
            disabled={isSaving}
            onChange={(event) => onChangeMatchName(event.target.value)}
            placeholder="Match"
          />
          <label
            htmlFor="currentMatchName"
            className="match-name-pencil"
            title="Ändra matchnamn"
          >
            <i className="bi bi-pencil" aria-hidden="true" />
            <span className="visually-hidden">Ändra matchnamn</span>
          </label>
        </div>
      </Form.Group>

      {teams.length > 2 && (
        <fieldset className="mb-3" disabled={isSaving}>
          <legend className="h6">Cup – välj två lag som möts</legend>
          <div className="d-flex flex-wrap gap-2">
            {teams.map((team) => {
              const isSelected = matchTeams.some(
                (selected) => selected.id === team.id,
              );
              return (
                <Button
                  className="team-choice"
                  key={team.id}
                  variant="light"
                  aria-pressed={isSelected}
                  disabled={!isSelected && matchTeams.length >= 2}
                  onClick={() => onToggleTeam(team.id)}
                >
                  <span
                    className="team-dot"
                    style={{ background: teamColor(team.id) }}
                    aria-hidden="true"
                  />
                  {team.name}
                  {isSelected && (
                    <i className="bi bi-check-lg ms-2" aria-hidden="true" />
                  )}
                </Button>
              );
            })}
          </div>
          <div className="text-muted small mt-2">
            {matchTeams.length} av 2 lag valda. Avmarkera ett lag för att byta
            motståndare.
          </div>
        </fieldset>
      )}

      <div className="scoreboard">
        {matchTeams.map((team) => {
          const score = getScore(team.id);

          return (
            <div
              className="scoreboard-side"
              style={{ borderTopColor: teamColor(team.id) }}
              key={team.id}
            >
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
            </div>
          );
        })}
      </div>

      {matchTeams.length < 2 && (
        <p className="scoreboard-empty">
          Välj två lag ovan för att börja matchen.
        </p>
      )}

      {isDraw && (
        <Form.Group controlId="matchWinner" className="winner-choice mt-4">
          <Form.Label>Vinnare vid lika resultat</Form.Label>
          <Form.Select
            value={winnerGameTeamId ?? ""}
            disabled={isSaving}
            onChange={(event) => onChangeWinner(event.target.value || null)}
          >
            <option value="">Oavgjort – ingen vinnare</option>
            {matchTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Form.Select>
          <Form.Text>
            Välj vinnaren om matchen avgjordes trots lika poäng, till exempel
            genom straffar. Poängen behålls.
          </Form.Text>
        </Form.Group>
      )}

      <div className="d-grid gap-2 d-md-flex mt-3">
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isSaving || matchTeams.length !== 2}
        >
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
    </section>
  );
}
