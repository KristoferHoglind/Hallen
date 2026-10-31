import { Button, Form } from "react-bootstrap";

type TeamScoreControlProps = {
  teamName: string;
  playerCount: number;
  score: number;
  disabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onChangeScore: (score: number) => void;
};

export function TeamScoreControl({
  teamName,
  playerCount,
  score,
  disabled,
  onDecrease,
  onIncrease,
  onChangeScore,
}: TeamScoreControlProps) {
  return (
    <section className="team-score" aria-label={teamName}>
      <div className="score-team-name">{teamName}</div>
      <div className="text-muted small">{playerCount} spelare</div>
      <Form.Control
        type="number"
        min={0}
        value={score}
        disabled={disabled}
        aria-label={`Poäng för ${teamName}`}
        onChange={(event) =>
          onChangeScore(
            event.target.value === "" ? 0 : Number(event.target.value),
          )
        }
        className="score-value"
      />
      <div className="d-flex justify-content-center gap-3">
        <Button
          variant="light"
          className="score-adjust"
          disabled={disabled || score <= 0}
          onClick={onDecrease}
          aria-label={`Minska poäng för ${teamName}`}
        >
          <i className="bi bi-dash" aria-hidden="true" />
        </Button>
        <Button
          variant="light"
          className="score-adjust"
          disabled={disabled}
          onClick={onIncrease}
          aria-label={`Öka poäng för ${teamName}`}
        >
          <i className="bi bi-plus" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
