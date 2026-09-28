import { useEffect, useState } from "react";
import {
  createSportsGroup,
  deleteSportsGroup,
  getSportsGroups,
  updateSportsGroup,
} from "../api/sportsGroupsApi";
import type { SportsGroup } from "../types/sportsGroup";
import { DeleteSportsGroupModal } from "./DeleteSportsGroupModal";
import { EditSportsGroupModal } from "./EditSportsGroupModal";
import { GroupAdminTab } from "./GroupAdminTab";
import { Link } from "react-router-dom";

export function SportsGroupsPage() {
  const [sportsGroups, setSportsGroups] = useState<SportsGroup[]>([]);
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

        if (result.length > 0) {
          setSelectedSportsGroup(result[0]);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Kunde inte ladda grupper.");
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
  }, []);

  async function handleCreateSportsGroup(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = newGroupName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

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
    } catch {
      setErrorMessage("Kunde inte skapa grupp.");
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="mb-1">Administrera grupper</h1>
          <p className="text-muted mb-0">
            Skapa grupper och hantera spelare inför speltillfällen.
          </p>
        </div>

        <Link to="/spela" className="btn btn-outline-primary">
          Till spela
        </Link>
      </div>

      <GroupAdminTab
        sportsGroups={sportsGroups}
        selectedSportsGroup={selectedSportsGroup}
        isLoading={isLoading}
        isSaving={isSaving}
        errorMessage={errorMessage}
        newGroupName={newGroupName}
        onChangeNewGroupName={setNewGroupName}
        onCreateSportsGroup={handleCreateSportsGroup}
        onSelectSportsGroup={setSelectedSportsGroup}
        onOpenEditSportsGroupModal={openEditSportsGroupModal}
        onOpenDeleteSportsGroupModal={openDeleteSportsGroupModal}
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
