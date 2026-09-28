import { useEffect, useState } from "react";
import {
  addSportsGroupMember,
  getSportsGroupMembers,
  removeSportsGroupMember,
  updateSportsGroupMemberRole,
} from "../api/sportsGroupMembersApi";
import type {
  SportsGroupMember,
  SportsGroupMemberRole,
} from "../types/sportsGroupMember";

export function useSportsGroupMembers(sportsGroupId: string) {
  const [members, setMembers] = useState<SportsGroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      try {
        setIsLoading(true);

        const result = await getSportsGroupMembers(sportsGroupId);

        if (!isMounted) {
          return;
        }

        setMembers(result);
        setErrorMessage(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Kunde inte ladda medlemmar.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [sportsGroupId]);

  async function addMember(email: string, role: SportsGroupMemberRole) {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const addedMember = await addSportsGroupMember(sportsGroupId, {
        email,
        role,
      });

      setMembers((currentMembers) => {
        const existingMember = currentMembers.find(
          (member) => member.id === addedMember.id,
        );

        if (existingMember) {
          return currentMembers.map((member) =>
            member.id === addedMember.id ? addedMember : member,
          );
        }

        return [...currentMembers, addedMember].sort((a, b) =>
          a.displayName.localeCompare(b.displayName, "sv-SE"),
        );
      });
    } catch {
      setErrorMessage("Kunde inte lägga till medlem.");
      throw new Error("Kunde inte lägga till medlem.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateMemberRole(
    memberId: string,
    role: SportsGroupMemberRole,
  ) {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const updatedMember = await updateSportsGroupMemberRole(
        sportsGroupId,
        memberId,
        { role },
      );

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );
    } catch {
      setErrorMessage("Kunde inte ändra roll.");
      throw new Error("Kunde inte ändra roll.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeMember(memberId: string) {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      await removeSportsGroupMember(sportsGroupId, memberId);

      setMembers((currentMembers) =>
        currentMembers.filter((member) => member.id !== memberId),
      );
    } catch {
      setErrorMessage("Kunde inte ta bort medlem.");
      throw new Error("Kunde inte ta bort medlem.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    members,
    isLoading,
    isSaving,
    errorMessage,
    addMember,
    updateMemberRole,
    removeMember,
  };
}