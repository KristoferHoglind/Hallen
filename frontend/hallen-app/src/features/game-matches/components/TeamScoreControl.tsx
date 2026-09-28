import { Button, Card, Form } from "react-bootstrap";

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
    <Card className="h-100">
      <Card.Body>
        <div className="text-center mb-3">
          <div className="fw-semibold">{teamName}</div>
          <div className="text-muted small">{playerCount} spelare</div>
        </div>

        <div className="d-flex align-items-center justify-content-center gap-2 flex-nowrap">
          <Button
            variant="outline-danger"
            size="lg"
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 p-0"
            style={{ width: 52, height: 52 }}
            disabled={disabled || score <= 0}
            onClick={onDecrease}
            aria-label={`Minska poäng för ${teamName}`}
          >
            <i className="bi bi-dash-lg" />
          </Button>

          <Form.Control
            type="number"
            min={0}
            value={score}
            disabled={disabled}
            onChange={(event) =>
              onChangeScore(
                event.target.value === "" ? 0 : Number(event.target.value),
              )
            }
            className="text-center fw-bold border-0 bg-light flex-shrink-0 px-1"
            style={{
              width: 88,
              minWidth: 88,
              fontSize: "2rem",
              lineHeight: 1.1,
            }}
          />

          <Button
            variant="outline-success"
            size="lg"
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 p-0"
            style={{ width: 52, height: 52 }}
            disabled={disabled}
            onClick={onIncrease}
            aria-label={`Öka poäng för ${teamName}`}
          >
            <i className="bi bi-plus-lg" />
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
