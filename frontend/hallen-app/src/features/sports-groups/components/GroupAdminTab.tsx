import type { SportsGroup } from "../types/sportsGroup";
import { Button } from "react-bootstrap";
import { SportsGroupsListCard } from "./SportsGroupsListCard";

type GroupAdminTabProps = {
  currentUserId: string;
  initialGroupTab: "players" | "members" | "results" | "statistics";
  onGroupPermissionsChanged: (groupId: string) => Promise<void>;
  canCreateGroups: boolean;
  createDisabled: boolean;
  sportsGroups: SportsGroup[];
  selectedSportsGroup: SportsGroup | null;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onOpenCreateSportsGroup: () => void;
  onSelectSportsGroup: (sportsGroup: SportsGroup | null) => void;
  onOpenEditSportsGroupModal: (sportsGroup: SportsGroup) => void;
  onOpenDeleteSportsGroupModal: (sportsGroup: SportsGroup) => void;
};

export function GroupAdminTab({
  currentUserId,
  initialGroupTab,
  onGroupPermissionsChanged,
  canCreateGroups,
  createDisabled,
  sportsGroups,
  selectedSportsGroup,
  isLoading,
  isSaving,
  errorMessage,
  onOpenCreateSportsGroup,
  onSelectSportsGroup,
  onOpenEditSportsGroupModal,
  onOpenDeleteSportsGroupModal,
}: GroupAdminTabProps) {
  return (
    <div>
      <SportsGroupsListCard
        currentUserId={currentUserId}
        initialGroupTab={initialGroupTab}
        onGroupPermissionsChanged={onGroupPermissionsChanged}
        sportsGroups={sportsGroups}
        selectedSportsGroup={selectedSportsGroup}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onSelectSportsGroup={onSelectSportsGroup}
        onOpenEditSportsGroupModal={onOpenEditSportsGroupModal}
        onOpenDeleteSportsGroupModal={onOpenDeleteSportsGroupModal}
      />
      {canCreateGroups ? (
        <Button
          className="mt-3"
          onClick={onOpenCreateSportsGroup}
          disabled={isSaving || createDisabled}
        >
          Skapa ny spelargrupp
        </Button>
      ) : (
        <p className="text-muted mt-3">
          Ditt konto saknar behörighet att skapa nya grupper. Det gäller även om
          du äger en befintlig grupp. Kontakta en systemadministratör om du vill
          kunna skapa grupper.
        </p>
      )}
    </div>
  );
}
