import { useEffect, useState } from "react";
import {
  addSportsGroupMember,
  getSportsGroupMembers,
  removeSportsGroupMember,
  updateSportsGroupMemberRole,
  transferSportsGroupOwnership,
} from "../api/sportsGroupMembersApi";
import type {
  SportsGroupMember,
  SportsGroupMemberRole,
} from "../types/sportsGroupMember";

const roleOrder: Record<SportsGroupMemberRole, number> = {
  Owner: 0,
  Admin: 1,
  Member: 2,
};

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

  async function transferOwnership(memberId: string) {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await transferSportsGroupOwnership(sportsGroupId, memberId);
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? { ...member, role: "Owner" }
            : member.role === "Owner"
              ? { ...member, role: "Admin" }
              : member,
        ),
      );
      return true;
    } catch (cause) {
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Kunde inte överföra ägarskapet.",
      );
      return false;
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

  const sortedMembers = [...members].sort(
    (a, b) =>
      roleOrder[a.role] - roleOrder[b.role] ||
      a.displayName.localeCompare(b.displayName, "sv-SE") ||
      a.email.localeCompare(b.email, "sv-SE") ||
      a.id.localeCompare(b.id),
  );

  return {
    members: sortedMembers,
    isLoading,
    isSaving,
    errorMessage,
    addMember,
    updateMemberRole,
    removeMember,
    transferOwnership,
  };
}
