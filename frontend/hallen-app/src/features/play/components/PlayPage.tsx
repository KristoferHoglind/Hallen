import { GroupDescription } from "../../sports-groups/components/GroupOverview";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Pagination,
  Spinner,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { GameSessionsPanel } from "../../game-sessions/components/GameSessionsPanel";
import { getSportsGroups } from "../../sports-groups/api/sportsGroupsApi";
import type { SportsGroup } from "../../sports-groups/types/sportsGroup";

export function PlayPage() {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [isChoosingGroup, setIsChoosingGroup] = useState(true);
  const [sportsGroups, setSportsGroups] = useState<SportsGroup[]>([]);
  const [selectedSportsGroupId, setSelectedSportsGroupId] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
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
      } catch (cause) {
        if (isActive) {
          setErrorMessage(
            cause instanceof Error
              ? cause.message
              : "Kunde inte hämta grupper.",
          );
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

  const query = search.trim().toLocaleLowerCase("sv-SE");
  const filtered = sportsGroups.filter((group) =>
    group.name.toLocaleLowerCase("sv-SE").includes(query),
  );
  // Keep role sections together across page boundaries, sorted by name within each section.
  const ordered = [
    ...filtered.filter((group) => group.canManage),
    ...filtered.filter((group) => !group.canManage),
  ];
  const size =
    pageSize === "all" ? Math.max(1, ordered.length) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(ordered.length / size));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * size;
  const visible = ordered.slice(offset, offset + size);
  const firstPageNumber = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPageNumber + index,
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div className="mb-4">
          <h1 className="page-title mb-1">Spelöversikt</h1>
          <p className="text-muted mb-0">
            Spelsessioner, matcher och resultat för dina grupper.
          </p>
        </div>
      </div>

      {isChoosingGroup && (
        <Card className="plain-section group-picker mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h2 className="h4 mb-1">Öppna en grupp</h2>
                <div className="text-muted small">
                  Välj en grupp för att se spelsessioner, matcher och resultat.
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
              <>
                <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
                  <Form.Group
                    controlId="playGroupSearch"
                    className="flex-grow-1"
                  >
                    <Form.Label>Sök grupp</Form.Label>
                    <Form.Control
                      type="search"
                      placeholder="Gruppnamn"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                  </Form.Group>
                  <Form.Group controlId="playGroupsPerPage">
                    <Form.Label>Grupper per sida</Form.Label>
                    <Form.Select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="all">Alla</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <p className="text-muted small" role="status">
                  {ordered.length
                    ? `Visar ${offset + 1}–${offset + visible.length} av ${ordered.length} grupper`
                    : "Inga grupper matchar din sökning."}
                  {query && ` (${sportsGroups.length} totalt)`}
                </p>
                {ordered.length === 0 && (
                  <p>Prova ett annat gruppnamn eller rensa sökningen.</p>
                )}
                <div className="d-flex flex-column gap-4">
                  {[
                    {
                      id: "managed",
                      title: "Grupper du hanterar",
                      groups: visible.filter((group) => group.canManage),
                    },
                    {
                      id: "member",
                      title: "Grupper du är medlem i",
                      groups: visible.filter((group) => !group.canManage),
                    },
                  ]
                    .filter((section) => section.groups.length > 0)
                    .map((section) => (
                      <section
                        key={section.id}
                        aria-labelledby={`play-groups-${section.id}`}
                      >
                        <h3
                          className="h6 mb-3"
                          id={`play-groups-${section.id}`}
                        >
                          {section.title}
                        </h3>
                        <ul className="play-group-options list-unstyled">
                          {section.groups.map((group) => (
                            <li key={group.id}>
                              <button
                                type="button"
                                className="play-group-label"
                                onClick={() => {
                                  setSelectedSportsGroupId(group.id);
                                  setIsChoosingGroup(false);
                                }}
                              >
                                <span
                                  className="play-group-avatar"
                                  aria-hidden="true"
                                >
                                  <i className="bi bi-people" />
                                </span>
                                <span className="play-group-name">
                                  {group.name}
                                  <span className="d-block small text-muted fw-normal">
                                    {getRoleLabel(group)}
                                  </span>
                                </span>
                                <i
                                  className="bi bi-chevron-right play-group-check"
                                  aria-hidden="true"
                                />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                </div>
                {pageCount > 1 && (
                  <nav aria-label="Sidor med spelargrupper" className="mt-3">
                    <Pagination size="sm" className="flex-wrap mb-0">
                      <Pagination.First
                        aria-label="Första sidan"
                        disabled={currentPage === 1}
                        onClick={() => setPage(1)}
                      />
                      <Pagination.Prev
                        aria-label="Föregående sida"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      />
                      {pageNumbers.map((number) => (
                        <Pagination.Item
                          key={number}
                          active={number === currentPage}
                          aria-label={`Sida ${number}`}
                          onClick={() => setPage(number)}
                        >
                          {number}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        aria-label="Nästa sida"
                        disabled={currentPage === pageCount}
                        onClick={() => setPage(currentPage + 1)}
                      />
                      <Pagination.Last
                        aria-label="Sista sidan"
                        disabled={currentPage === pageCount}
                        onClick={() => setPage(pageCount)}
                      />
                    </Pagination>
                  </nav>
                )}
              </>
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
                <p className="section-eyebrow mb-1">
                  Vald spelargrupp · {getRoleLabel(selectedSportsGroup)}
                </p>
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
          <GroupDescription
            key={selectedSportsGroup.id}
            sportsGroupId={selectedSportsGroup.id}
            canManage={selectedSportsGroup.canManage}
          />
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

function getRoleLabel(group: SportsGroup) {
  if (group.currentUserRole === "Owner") return "Ägare";
  if (group.currentUserRole === "Admin") return "Administratör";
  return "Medlem";
}
