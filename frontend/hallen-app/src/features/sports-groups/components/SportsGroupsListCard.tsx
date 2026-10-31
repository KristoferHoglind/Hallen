import { Accordion, Alert, Button, Spinner } from "react-bootstrap";
import { PlayersPanel } from "../../players/components/PlayersPanel";
import type { SportsGroup } from "../types/sportsGroup";

type SportsGroupsListCardProps = {
  sportsGroups: SportsGroup[];
  selectedSportsGroup: SportsGroup | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectSportsGroup: (sportsGroup: SportsGroup | null) => void;
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
  if (!isLoading && !errorMessage && sportsGroups.length === 0) return null;

  return (
    <section aria-label="Grupper">
      <h2 className="h5 mb-3">Grupper</h2>
      {isLoading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Laddar grupper...</span>
        </div>
      )}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {!isLoading && sportsGroups.length > 0 && (
        <Accordion
          flush
          className="groups-accordion"
          activeKey={selectedSportsGroup?.id ?? null}
          onSelect={(key) =>
            onSelectSportsGroup(
              sportsGroups.find((group) => group.id === key) ?? null,
            )
          }
        >
          {sportsGroups.map((group) => {
            const isOpen = selectedSportsGroup?.id === group.id;
            return (
              <Accordion.Item eventKey={group.id} key={group.id}>
                <div
                  className={`group-accordion-heading d-flex align-items-center ${isOpen ? "is-open" : ""}`}
                >
                  <h3 className="h6 mb-0 flex-grow-1">
                    <Accordion.Button className="text-break">
                      {group.name}
                    </Accordion.Button>
                  </h3>
                  {group.isOwner && (
                    <div className="d-flex flex-shrink-0 pe-2">
                      <Button
                        variant="link"
                        size="sm"
                        aria-label={`Redigera ${group.name}`}
                        title="Redigera grupp"
                        onClick={() => onOpenEditSportsGroupModal(group)}
                      >
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className={isOpen ? "" : "text-danger"}
                        aria-label={`Ta bort ${group.name}`}
                        title="Ta bort grupp"
                        onClick={() => onOpenDeleteSportsGroupModal(group)}
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
                <Accordion.Body>
                  {isOpen && (
                    <PlayersPanel
                      sportsGroupId={group.id}
                      canManage={group.canManage}
                    />
                  )}
                </Accordion.Body>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </section>
  );
}
