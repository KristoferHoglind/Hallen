import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createSportsGroup,
  deleteSportsGroup,
  getSportsGroups,
  getSportsGroup,
  updateSportsGroup,
} from "../api/sportsGroupsApi";
import type { SportsGroup } from "../types/sportsGroup";
import { DeleteSportsGroupModal } from "./DeleteSportsGroupModal";
import { EditSportsGroupModal } from "./EditSportsGroupModal";
import { GroupAdminTab } from "./GroupAdminTab";
import { CreateSportsGroupModal } from "./CreateSportsGroupModal";

export function SportsGroupsPage({
  currentUserId,
  canCreateGroups,
}: {
  currentUserId: string;
  canCreateGroups: boolean;
}) {
  const [searchParams] = useSearchParams();
  const requestedGroupId = searchParams.get("grupp");
  const [sportsGroups, setSportsGroups] = useState<SportsGroup[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(
    null,
  );
  const [newGroupName, setNewGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSportsGroup, setSelectedSportsGroup] =
    useState<SportsGroup | null>(null);

  const [sportsGroupBeingEdited, setSportsGroupBeingEdited] =
    useState<SportsGroup | null>(null);
  const [editSportsGroupName, setEditSportsGroupName] = useState("");

  const [sportsGroupBeingDeleted, setSportsGroupBeingDeleted] =
    useState<SportsGroup | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSportsGroups() {
      try {
        const result = await getSportsGroups();

        if (!isMounted) {
          return;
        }

        setSportsGroups(result);
        setErrorMessage(null);

        setSelectedSportsGroup(
          result.find((group) => group.id === requestedGroupId) ?? null,
        );
      } catch (cause) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          cause instanceof Error ? cause.message : "Kunde inte ladda grupper.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialSportsGroups();

    return () => {
      isMounted = false;
    };
  }, [requestedGroupId]);

  async function handleCreateSportsGroup(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = newGroupName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      setIsSaving(true);
      setCreateErrorMessage(null);

      const createdSportsGroup = await createSportsGroup({
        name: trimmedName,
      });

      setSportsGroups((currentSportsGroups) =>
        [...currentSportsGroups, createdSportsGroup].sort((a, b) =>
          a.name.localeCompare(b.name, "sv-SE"),
        ),
      );

      setSelectedSportsGroup(createdSportsGroup);
      setNewGroupName("");
      setIsCreatingGroup(false);
    } catch {
      setCreateErrorMessage("Kunde inte skapa grupp.");
    } finally {
      setIsSaving(false);
    }
  }

  function openEditSportsGroupModal(sportsGroup: SportsGroup) {
    setSportsGroupBeingEdited(sportsGroup);
    setEditSportsGroupName(sportsGroup.name);
  }

  function closeEditSportsGroupModal() {
    setSportsGroupBeingEdited(null);
    setEditSportsGroupName("");
  }

  async function handleUpdateSportsGroup(event: React.FormEvent) {
    event.preventDefault();

    if (!sportsGroupBeingEdited) {
      return;
    }

    const trimmedName = editSportsGroupName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      await updateSportsGroup(sportsGroupBeingEdited.id, {
        name: trimmedName,
      });

      setSportsGroups((currentSportsGroups) =>
        currentSportsGroups
          .map((sportsGroup) =>
            sportsGroup.id === sportsGroupBeingEdited.id
              ? { ...sportsGroup, name: trimmedName }
              : sportsGroup,
          )
          .sort((a, b) => a.name.localeCompare(b.name, "sv-SE")),
      );

      if (selectedSportsGroup?.id === sportsGroupBeingEdited.id) {
        setSelectedSportsGroup({
          ...selectedSportsGroup,
          name: trimmedName,
        });
      }

      closeEditSportsGroupModal();
    } catch {
      setErrorMessage("Kunde inte uppdatera grupp.");
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteSportsGroupModal(sportsGroup: SportsGroup) {
    setSportsGroupBeingDeleted(sportsGroup);
    setDeleteConfirmationName("");
  }

  function closeDeleteSportsGroupModal() {
    setSportsGroupBeingDeleted(null);
    setDeleteConfirmationName("");
  }

  async function handleDeleteSportsGroup() {
    if (!sportsGroupBeingDeleted) {
      return;
    }

    if (deleteConfirmationName !== sportsGroupBeingDeleted.name) {
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage(null);

      await deleteSportsGroup(sportsGroupBeingDeleted.id);

      setSportsGroups((currentSportsGroups) =>
        currentSportsGroups.filter(
          (sportsGroup) => sportsGroup.id !== sportsGroupBeingDeleted.id,
        ),
      );

      if (selectedSportsGroup?.id === sportsGroupBeingDeleted.id) {
        setSelectedSportsGroup(null);
      }

      closeDeleteSportsGroupModal();
    } catch {
      setErrorMessage("Kunde inte ta bort grupp.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleGroupPermissionsChanged(groupId: string) {
    try {
      const updated = await getSportsGroup(groupId);
      setSportsGroups((current) =>
        current.map((group) => (group.id === groupId ? updated : group)),
      );
      setSelectedSportsGroup((current) =>
        current?.id === groupId ? updated : current,
      );
    } catch {
      setErrorMessage(
        "Rollen är sparad men gruppvyn kunde inte uppdateras. Ladda om sidan för att se aktuella behörigheter.",
      );
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="page-title mb-1">Mina grupper</h1>
          <p className="text-muted mb-0">
            Se dina grupper, spelare och medlemmar.
          </p>
        </div>
      </div>

      <GroupAdminTab
        currentUserId={currentUserId}
        initialGroupTab={
          searchParams.get("flik") === "resultat"
            ? "results"
            : searchParams.get("flik") === "statistik"
              ? "statistics"
              : searchParams.get("flik") === "medlemmar"
                ? "members"
                : "players"
        }
        onGroupPermissionsChanged={handleGroupPermissionsChanged}
        canCreateGroups={canCreateGroups}
        sportsGroups={sportsGroups}
        selectedSportsGroup={selectedSportsGroup}
        isLoading={isLoading}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onOpenCreateSportsGroup={() => {
          setNewGroupName("");
          setCreateErrorMessage(null);
          setIsCreatingGroup(true);
        }}
        onSelectSportsGroup={setSelectedSportsGroup}
        onOpenEditSportsGroupModal={openEditSportsGroupModal}
        onOpenDeleteSportsGroupModal={openDeleteSportsGroupModal}
      />

      <CreateSportsGroupModal
        show={isCreatingGroup}
        name={newGroupName}
        isSaving={isSaving}
        errorMessage={createErrorMessage}
        onChangeName={setNewGroupName}
        onSubmit={handleCreateSportsGroup}
        onClose={() => {
          if (!isSaving) setIsCreatingGroup(false);
        }}
      />

      <EditSportsGroupModal
        sportsGroup={sportsGroupBeingEdited}
        name={editSportsGroupName}
        isSaving={isSaving}
        onChangeName={setEditSportsGroupName}
        onClose={closeEditSportsGroupModal}
        onSubmit={handleUpdateSportsGroup}
      />

      <DeleteSportsGroupModal
        sportsGroup={sportsGroupBeingDeleted}
        confirmationName={deleteConfirmationName}
        isDeleting={isDeleting}
        onChangeConfirmationName={setDeleteConfirmationName}
        onClose={closeDeleteSportsGroupModal}
        onConfirmDelete={handleDeleteSportsGroup}
      />
    </div>
  );
}
