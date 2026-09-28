import { Alert, Button, Card, Spinner } from "react-bootstrap";
import type { SportsGroup } from "../types/sportsGroup";

type SportsGroupsListCardProps = {
  sportsGroups: SportsGroup[];
  selectedSportsGroup: SportsGroup | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectSportsGroup: (sportsGroup: SportsGroup) => void;
  onOpenEditSportsGroupModal: (sportsGroup: SportsGroup) => void;
  onOpenDeleteSportsGroupModal: (sportsGroup: SportsGroup) => void;
};

export function SportsGroupsListCard({
  sportsGroups,
  selectedSportsGroup,
  isLoading,
  errorMessage,
  onSelectSportsGroup,
  onOpenEditSportsGroupModal,
  onOpenDeleteSportsGroupModal,
}: SportsGroupsListCardProps) {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Grupper</Card.Title>

        {isLoading && (
          <div className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Laddar grupper...</span>
          </div>
        )}

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        {!isLoading && !errorMessage && sportsGroups.length === 0 && (
          <Alert variant="info">Inga grupper finns ännu.</Alert>
        )}

        {!isLoading && sportsGroups.length > 0 && (
          <div className="list-group">
            {sportsGroups.map((sportsGroup) => {
              const isSelected = selectedSportsGroup?.id === sportsGroup.id;

              return (
                <div
                  key={sportsGroup.id}
                  className={`list-group-item ${isSelected ? "active" : ""}`}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <button
                      type="button"
                      className={`btn btn-link p-0 text-start text-decoration-none ${
                        isSelected ? "text-white" : "text-body"
                      }`}
                      onClick={() => onSelectSportsGroup(sportsGroup)}
                    >
                      <div className="fw-semibold">{sportsGroup.name}</div>
                    </button>

                    <div className="btn-group btn-group-sm">
                      {sportsGroup.isOwner && (
                        <Button
                          variant={
                            isSelected ? "outline-light" : "outline-primary"
                          }
                          size="sm"
                          aria-label={`Redigera ${sportsGroup.name}`}
                          title="Redigera"
                          onClick={() =>
                            onOpenEditSportsGroupModal(sportsGroup)
                          }
                        >
                          <i className="bi bi-pencil" />
                        </Button>
                      )}

                      {sportsGroup.isOwner && (
                        <Button
                          variant={
                            isSelected ? "outline-light" : "outline-danger"
                          }
                          size="sm"
                          aria-label={`Ta bort ${sportsGroup.name}`}
                          title="Ta bort"
                          onClick={() =>
                            onOpenDeleteSportsGroupModal(sportsGroup)
                          }
                        >
                          <i className="bi bi-trash" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
