import { GroupContents } from "./GroupContents";
import { Alert, Button, Spinner } from "react-bootstrap";
import type { SportsGroup } from "../types/sportsGroup";

type SportsGroupsListCardProps = {
  currentUserId: string;
  initialGroupTab: "players" | "members" | "results" | "statistics";
  onGroupPermissionsChanged: (groupId: string) => Promise<void>;
  sportsGroups: SportsGroup[];
  selectedSportsGroup: SportsGroup | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSelectSportsGroup: (sportsGroup: SportsGroup | null) => void;
  onOpenEditSportsGroupModal: (sportsGroup: SportsGroup) => void;
  onOpenDeleteSportsGroupModal: (sportsGroup: SportsGroup) => void;
};

export function SportsGroupsListCard({
  currentUserId,
  initialGroupTab,
  onGroupPermissionsChanged,
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
      {isLoading && (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Laddar grupper...</span>
        </div>
      )}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {!isLoading && sportsGroups.length > 0 && (
        <div className="groups-accordion accordion accordion-flush">
          {sportsGroups.map((group) => {
            const isOpen = selectedSportsGroup?.id === group.id;
            return (
              <section className="accordion-item" key={group.id}>
                <div
                  className={`group-accordion-heading d-flex align-items-center ${isOpen ? "is-open" : ""}`}
                >
                  <h3 className="h6 mb-0 flex-grow-1">
                    <button
                      type="button"
                      id={`group-heading-${group.id}`}
                      className={`accordion-button text-break ${isOpen ? "" : "collapsed"}`}
                      aria-expanded={isOpen}
                      aria-controls={`group-content-${group.id}`}
                      onClick={() => onSelectSportsGroup(isOpen ? null : group)}
                    >
                      {group.name}
                    </button>
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
                <div
                  id={`group-content-${group.id}`}
                  className="accordion-body"
                  role="region"
                  aria-labelledby={`group-heading-${group.id}`}
                  hidden={!isOpen}
                >
                  {isOpen && (
                    <GroupContents
                      currentUserId={currentUserId}
                      key={`${group.id}:${initialGroupTab}`}
                      group={group}
                      initialTab={initialGroupTab}
                      onGroupPermissionsChanged={onGroupPermissionsChanged}
                    />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
