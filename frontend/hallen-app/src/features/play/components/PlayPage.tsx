import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { GameSessionsPanel } from "../../game-sessions/components/GameSessionsPanel";
import { getSportsGroups } from "../../sports-groups/api/sportsGroupsApi";
import type { SportsGroup } from "../../sports-groups/types/sportsGroup";

export function PlayPage() {
  const [isChoosingGroup, setIsChoosingGroup] = useState(true);
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
          <h1 className="page-title mb-1">Spela</h1>
          <p className="text-muted mb-0">
            Välj grupp, skapa speltillfälle och registrera matcher.
          </p>
        </div>
      </div>

      {isChoosingGroup && (
        <Card className="plain-section group-picker mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h2 className="h4 mb-1">Vilka spelar idag?</h2>
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
              <div>
                <fieldset className="play-group-options">
                  <legend className="visually-hidden">Välj spelargrupp</legend>
                  {sportsGroups.map((group) => {
                    const isSelected = selectedSportsGroupId === group.id;
                    return (
                      <div className="play-group-option" key={group.id}>
                        <input
                          type="radio"
                          name="playGroup"
                          id={`play-group-${group.id}`}
                          className="visually-hidden"
                          value={group.id}
                          checked={isSelected}
                          onChange={() => setSelectedSportsGroupId(group.id)}
                        />
                        <label
                          htmlFor={`play-group-${group.id}`}
                          className={`play-group-label ${isSelected ? "is-selected" : ""}`}
                        >
                          <span
                            className="play-group-avatar"
                            aria-hidden="true"
                          >
                            <i className="bi bi-people" />
                          </span>
                          <span className="play-group-name">{group.name}</span>
                          <i
                            className={`bi ${isSelected ? "bi-check-circle-fill" : "bi-circle"} play-group-check`}
                            aria-hidden="true"
                          />
                        </label>
                      </div>
                    );
                  })}
                </fieldset>
                <Button
                  className="mt-3"
                  onClick={() => setIsChoosingGroup(false)}
                  disabled={!selectedSportsGroup}
                >
                  Fortsätt till spelsessioner{" "}
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {!isChoosingGroup && selectedSportsGroup && (
        <>
          <section
            className="selected-group-context"
            aria-label="Vald spelargrupp"
          >
            <div className="selected-group-identity">
              <span className="selected-group-icon" aria-hidden="true">
                <i className="bi bi-people-fill" />
              </span>
              <div className="selected-group-text">
                <p className="section-eyebrow mb-1">Vald spelargrupp</p>
                <h2 className="selected-group-name mb-0">
                  {selectedSportsGroup.name}
                </h2>
              </div>
            </div>
            <Button
              variant="outline-secondary"
              className="btn-navigation"
              onClick={() => setIsChoosingGroup(true)}
            >
              <i className="bi bi-arrow-left-right" aria-hidden="true" />
              Byt grupp
            </Button>
          </section>
          <GameSessionsPanel
            key={selectedSportsGroup.id}
            sportsGroupId={selectedSportsGroup.id}
            canManage={selectedSportsGroup.canManage}
          />
        </>
      )}
    </div>
  );
}
