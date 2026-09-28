import { Accordion, Badge, Button, Card, Col, Row } from "react-bootstrap";
import type { GameMatch } from "../types/gameMatch";

type MatchHistoryItemProps = {
  match: GameMatch;
  isSaving: boolean;
  canManage: boolean;
  onEdit: (match: GameMatch) => void;
  onDelete: (match: GameMatch) => void;
};

export function MatchHistoryItem({
  match,
  isSaving,
  canManage,
  onEdit,
  onDelete,
}: MatchHistoryItemProps) {
  const sortedResults = match.teamResults
    .slice()
    .sort((a, b) =>
      b.score === a.score
        ? a.gameTeamName.localeCompare(b.gameTeamName, "sv")
        : b.score - a.score,
    );

  return (
    <Accordion.Item eventKey={match.id}>
      <Accordion.Header>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 w-100 me-3">
          <div className="fw-semibold">
            {match.name || "Match"} ({formatMatchDate(match.createdAt)})
          </div>

          <div className="d-flex flex-wrap gap-2">
            {sortedResults.map((result) => (
              <Badge
                bg="light"
                text="dark"
                className="border"
                key={result.gameTeamId}
              >
                {result.gameTeamName}: {result.score}
              </Badge>
            ))}
          </div>
        </div>
      </Accordion.Header>

      <Accordion.Body>
        <Row className="g-3">
          {sortedResults.map((result) => (
            <Col md={6} lg={4} key={result.gameTeamId}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <Card.Title className="h6 mb-0">
                      {result.gameTeamName}
                    </Card.Title>

                    <Badge bg="primary">{result.score}</Badge>
                  </div>

                  {result.players.length === 0 ? (
                    <p className="text-muted small mb-0">
                      Inga spelare sparade för laget i den här matchen.
                    </p>
                  ) : (
                    <ul className="mb-0 ps-3 text-start">
                      {result.players
                        .slice()
                        .sort((a, b) =>
                          a.playerName.localeCompare(b.playerName, "sv"),
                        )
                        .map((player) => (
                          <li key={player.playerId}>{player.playerName}</li>
                        ))}
                    </ul>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {canManage && (
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => onEdit(match)}
              disabled={isSaving}
              aria-label="Redigera match"
            >
              <i className="bi bi-pencil" />
            </Button>

            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onDelete(match)}
              disabled={isSaving}
              aria-label="Radera match"
            >
              <i className="bi bi-trash" />
            </Button>
          </div>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
}

function formatMatchDate(dateString: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}
