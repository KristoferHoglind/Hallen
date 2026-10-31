import type { SportsGroup } from "../types/sportsGroup";
import { Button } from "react-bootstrap";
import { SportsGroupsListCard } from "./SportsGroupsListCard";

type GroupAdminTabProps = {
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
        sportsGroups={sportsGroups}
        selectedSportsGroup={selectedSportsGroup}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onSelectSportsGroup={onSelectSportsGroup}
        onOpenEditSportsGroupModal={onOpenEditSportsGroupModal}
        onOpenDeleteSportsGroupModal={onOpenDeleteSportsGroupModal}
      />
      <Button
        className="mt-3"
        onClick={onOpenCreateSportsGroup}
        disabled={isSaving}
      >
        Skapa ny spelargrupp
      </Button>
    </div>
  );
}
