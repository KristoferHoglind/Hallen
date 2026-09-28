import { Alert } from "react-bootstrap";
import { PlayersPanel } from "../../players/components/PlayersPanel";
import type { SportsGroup } from "../types/sportsGroup";
import { CreateSportsGroupCard } from "./CreateSportsGroupCard";
import { SportsGroupsListCard } from "./SportsGroupsListCard";
import { SportsGroupMembersPanel } from "../../sports-group-members/components/SportsGroupMembersPanel";

type GroupAdminTabProps = {
  sportsGroups: SportsGroup[];
  selectedSportsGroup: SportsGroup | null;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  newGroupName: string;
  onChangeNewGroupName: (name: string) => void;
  onCreateSportsGroup: (event: React.FormEvent) => void;
  onSelectSportsGroup: (sportsGroup: SportsGroup) => void;
  onOpenEditSportsGroupModal: (sportsGroup: SportsGroup) => void;
  onOpenDeleteSportsGroupModal: (sportsGroup: SportsGroup) => void;
};

export function GroupAdminTab({
  sportsGroups,
  selectedSportsGroup,
  isLoading,
  isSaving,
  errorMessage,
  newGroupName,
  onChangeNewGroupName,
  onCreateSportsGroup,
  onSelectSportsGroup,
  onOpenEditSportsGroupModal,
  onOpenDeleteSportsGroupModal,
}: GroupAdminTabProps) {
  return (
    <div className="row g-4">
      <div className="col-12 col-lg-4">
        <CreateSportsGroupCard
          newGroupName={newGroupName}
          isSaving={isSaving}
          onChangeNewGroupName={onChangeNewGroupName}
          onCreateSportsGroup={onCreateSportsGroup}
        />

        <SportsGroupsListCard
          sportsGroups={sportsGroups}
          selectedSportsGroup={selectedSportsGroup}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onSelectSportsGroup={onSelectSportsGroup}
          onOpenEditSportsGroupModal={onOpenEditSportsGroupModal}
          onOpenDeleteSportsGroupModal={onOpenDeleteSportsGroupModal}
        />
      </div>

      <div className="col-12 col-lg-8">
        {selectedSportsGroup ? (
          <>
            <div className="mb-3">
              <h2 className="mb-1">{selectedSportsGroup.name}</h2>
              <p className="text-muted mb-0">
                Hantera spelare för den här gruppen.
              </p>
            </div>

            <PlayersPanel
              sportsGroupId={selectedSportsGroup.id}
              canManage={selectedSportsGroup.canManage}
            />

            <SportsGroupMembersPanel
              sportsGroupId={selectedSportsGroup.id}
              canManage={selectedSportsGroup.canManage}
              isOwner={selectedSportsGroup.isOwner}
            />
          </>
        ) : (
          <Alert variant="info">Välj en grupp för att hantera spelare.</Alert>
        )}
      </div>
    </div>
  );
}
