import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Form, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { GameSessionsPanel } from "../../game-sessions/components/GameSessionsPanel";
import { getSportsGroups } from "../../sports-groups/api/sportsGroupsApi";
import type { SportsGroup } from "../../sports-groups/types/sportsGroup";

export function PlayPage() {
  const [sportsGroups, setSportsGroups] = useState<SportsGroup[]>([]);
  const [selectedSportsGroupId, setSelectedSportsGroupId] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadSportsGroups() {
      try {
        setIsLoadingGroups(true);
        setErrorMessage(null);

        const response = await getSportsGroups();

        if (!isActive) {
          return;
        }

        const sortedGroups = [...response].sort((a, b) =>
          a.name.localeCompare(b.name, "sv"),
        );

        setSportsGroups(sortedGroups);

        if (sortedGroups.length > 0) {
          setSelectedSportsGroupId(sortedGroups[0].id);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Kunde inte hämta grupper.");
        }
      } finally {
        if (isActive) {
          setIsLoadingGroups(false);
        }
      }
    }

    loadSportsGroups();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedSportsGroup = useMemo(() => {
    return (
      sportsGroups.find(
        (sportsGroup) => sportsGroup.id === selectedSportsGroupId,
      ) ?? null
    );
  }, [sportsGroups, selectedSportsGroupId]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div className="mb-4">
          <h1 className="mb-1">Hallen</h1>
          <p className="text-muted mb-0">
            Välj grupp, skapa speltillfälle och registrera matcher.
          </p>
        </div>

        <Link to="/grupper" className="btn btn-outline-secondary btn-sm">
          Administrera grupper
        </Link>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <Card.Title className="mb-1">Spela</Card.Title>
              <div className="text-muted small">
                Välj vilken grupp du vill spela med.
              </div>
            </div>
          </div>

          {isLoadingGroups ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Laddar grupper...</span>
            </div>
          ) : errorMessage ? (
            <Alert variant="danger" className="mb-0">
              {errorMessage}
            </Alert>
          ) : sportsGroups.length === 0 ? (
            <Alert variant="info" className="mb-0">
              Det finns inga grupper ännu.{" "}
              <Alert.Link as={Link} to="/grupper">
                Skapa en grupp först.
              </Alert.Link>
            </Alert>
          ) : (
            <Form.Group controlId="activeSportsGroup">
              <Form.Label>Aktiv grupp</Form.Label>
              <Form.Select
                value={selectedSportsGroupId}
                onChange={(event) =>
                  setSelectedSportsGroupId(event.target.value)
                }
              >
                {sportsGroups.map((sportsGroup) => (
                  <option key={sportsGroup.id} value={sportsGroup.id}>
                    {sportsGroup.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </Card.Body>
      </Card>

      {selectedSportsGroup && (
        <GameSessionsPanel
          sportsGroupId={selectedSportsGroup.id}
          canManage={selectedSportsGroup.canManage}
        />
      )}
    </div>
  );
}
