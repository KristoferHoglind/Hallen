import { PasswordRecoveryAdmin } from "../../password-recovery/PasswordRecovery";
import { InvitationsPanel } from "../../invitations/components/InvitationsPanel";
import { useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { useSportsGroupMembers } from "../hooks/useSportsGroupMembers";
import type {
  SportsGroupMember,
  SportsGroupMemberRole,
} from "../types/sportsGroupMember";

type SportsGroupMembersPanelProps = {
  currentUserId: string;
  sportsGroupId: string;
  canManage: boolean;
  isOwner: boolean;
  onPermissionsChanged: () => Promise<void>;
};

export function SportsGroupMembersPanel({
  currentUserId,
  sportsGroupId,
  canManage,
  isOwner,
  onPermissionsChanged,
}: SportsGroupMembersPanelProps) {
  const {
    members,
    isLoading,
    isSaving,
    errorMessage,
    updateMemberRole,
    removeMember,
    transferOwnership,
  } = useSportsGroupMembers(sportsGroupId);

  const [selfDemotionTarget, setSelfDemotionTarget] = useState<string | null>(
    null,
  );
  const [isSelfDemoting, setIsSelfDemoting] = useState(false);
  const [transferTarget, setTransferTarget] =
    useState<SportsGroupMember | null>(null);
  const [ownershipNotice, setOwnershipNotice] = useState("");
  const [showInvitations, setShowInvitations] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  async function changeRole(memberId: string, role: SportsGroupMemberRole) {
    try {
      await updateMemberRole(memberId, role);
      await onPermissionsChanged();
      return true;
    } catch {
      // The hook displays the API error without changing the saved role.
      return false;
    }
  }

  async function confirmSelfDemotion() {
    if (!selfDemotionTarget || isSaving || isSelfDemoting) return;
    setIsSelfDemoting(true);
    try {
      if (await changeRole(selfDemotionTarget, "Member"))
        setSelfDemotionTarget(null);
    } finally {
      setIsSelfDemoting(false);
    }
  }

  async function confirmTransfer() {
    if (!transferTarget || isSaving) return;
    const transferred = await transferOwnership(transferTarget.id);
    if (transferred) {
      setOwnershipNotice(
        `${transferTarget.displayName} är nu gruppägare. Du är administratör.`,
      );
      setTransferTarget(null);
      await onPermissionsChanged();
    }
  }

  return (
    <section className="mt-4" aria-labelledby="groupMembersHeading">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h2 className="h5 mb-0" id="groupMembersHeading">
          Medlemmar
        </h2>
        {canManage && (
          <div className="d-flex flex-wrap gap-2">
            <Button onClick={() => setShowInvitations(true)}>
              <i className="bi bi-person-plus me-2" aria-hidden="true" />
              Bjud in medlem
            </Button>
            <Button
              variant="outline-secondary"
              disabled={isLoading}
              onClick={() => setShowRecovery(true)}
            >
              Återställ lösenord
            </Button>
          </div>
        )}
      </div>
      <p className="text-muted small">
        Här ser du vilka som har tillgång till gruppen och deras roller.
        {canManage &&
          " Bjud in fler med en länk, oavsett om de redan har ett konto eller är nya i Hallen."}
      </p>
      {isOwner && (
        <p className="text-muted small">
          Gruppen har en ägare. Du kan inte ändra din egen roll, men du kan
          överföra ägarskapet till en annan godkänd medlem.
        </p>
      )}
      {ownershipNotice && (
        <Alert variant="success" role="status">
          {ownershipNotice}
        </Alert>
      )}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Laddar medlemmar...</span>
        </div>
      ) : (
        <Table responsive hover size="sm">
          <thead>
            <tr>
              <th>Namn</th>
              <th>E-post</th>
              <th>Roll</th>
              <th>Status</th>
              {isOwner && <th className="text-end">Åtgärder</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.displayName}</td>
                <td>{member.email}</td>
                <td>
                  {canManage &&
                  member.role !== "Owner" &&
                  member.status === "Approved" ? (
                    <Form.Select
                      size="sm"
                      className="member-role-select"
                      aria-label={`Roll för ${member.displayName}`}
                      value={member.role}
                      onChange={(event) => {
                        const role = event.target
                          .value as SportsGroupMemberRole;
                        if (
                          member.appUserId === currentUserId &&
                          member.role === "Admin" &&
                          role === "Member"
                        ) {
                          setSelfDemotionTarget(member.id);
                        } else {
                          void changeRole(member.id, role);
                        }
                      }}
                      disabled={isSaving || isSelfDemoting}
                    >
                      <option value="Member">Medlem</option>
                      <option value="Admin">Admin</option>
                    </Form.Select>
                  ) : (
                    getRoleLabel(member.role)
                  )}
                </td>
                <td>{getStatusLabel(member.status)}</td>
                {isOwner && (
                  <td className="text-end">
                    {member.role !== "Owner" ? (
                      <div className="d-flex flex-wrap justify-content-end gap-2">
                        {member.status === "Approved" && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => setTransferTarget(member)}
                          >
                            Gör till ägare
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          aria-label={`Ta bort ${member.displayName}`}
                          onClick={() => {
                            void removeMember(member.id).catch(() => {});
                          }}
                          disabled={isSaving}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal
        show={Boolean(selfDemotionTarget)}
        onHide={() => {
          if (!isSaving && !isSelfDemoting) setSelfDemotionTarget(null);
        }}
        centered
        aria-labelledby="selfDemotionTitle"
        backdrop={isSaving || isSelfDemoting ? "static" : true}
        keyboard={!isSaving && !isSelfDemoting}
      >
        <Modal.Header closeButton={!isSaving && !isSelfDemoting}>
          <Modal.Title id="selfDemotionTitle">Byta till medlem?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vill du ändra din egen roll från administratör till medlem i den här
            gruppen?
          </p>
          <p className="mb-0">
            Du förlorar administratörsbehörigheten. För att bli administratör
            igen behöver ägaren eller en annan administratör ändra din roll.
          </p>
          {errorMessage && (
            <Alert className="mt-3 mb-0" variant="danger">
              {errorMessage}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            disabled={isSaving || isSelfDemoting}
            onClick={() => setSelfDemotionTarget(null)}
          >
            Avbryt
          </Button>
          <Button
            disabled={isSaving || isSelfDemoting}
            onClick={() => void confirmSelfDemotion()}
          >
            {isSelfDemoting ? "Ändrar roll..." : "Ja, bli medlem"}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={Boolean(transferTarget)}
        onHide={() => {
          if (!isSaving) setTransferTarget(null);
        }}
        centered
        aria-labelledby="transferOwnershipTitle"
        backdrop={isSaving ? "static" : true}
        keyboard={!isSaving}
      >
        <Modal.Header closeButton={!isSaving}>
          <Modal.Title id="transferOwnershipTitle">
            Överför ägarskap?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vill du överföra gruppens ägarskap till{" "}
            <strong>{transferTarget?.displayName}</strong> (
            {transferTarget?.email})?
          </p>
          <p className="mb-0">
            Personen blir gruppens enda ägare och du blir administratör. Du kan
            inte själv ta tillbaka ägarskapet.
          </p>
          {errorMessage && (
            <Alert className="mt-3 mb-0" variant="danger">
              {errorMessage}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            disabled={isSaving}
            onClick={() => setTransferTarget(null)}
          >
            Avbryt
          </Button>
          <Button disabled={isSaving} onClick={() => void confirmTransfer()}>
            {isSaving ? "Överför..." : "Ja, överför ägarskapet"}
          </Button>
        </Modal.Footer>
      </Modal>
      {canManage && (
        <>
          <Modal
            show={showInvitations}
            onHide={() => setShowInvitations(false)}
            size="lg"
            centered
            aria-labelledby="inviteMembersTitle"
          >
            <Modal.Header closeButton>
              <Modal.Title id="inviteMembersTitle">Bjud in medlem</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <InvitationsPanel
                sportsGroupId={sportsGroupId}
                isOwner={isOwner}
                showHeading={false}
              />
            </Modal.Body>
          </Modal>
          <Modal
            show={showRecovery}
            onHide={() => setShowRecovery(false)}
            centered
            aria-labelledby="recoverMemberTitle"
          >
            <Modal.Header closeButton>
              <Modal.Title id="recoverMemberTitle">
                Återställ lösenord
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <PasswordRecoveryAdmin
                key={
                  sportsGroupId +
                  members
                    .map((member) => member.id + member.role + member.status)
                    .join("")
                }
                groupId={sportsGroupId}
                showHeading={false}
                groupAccounts={members
                  .filter(
                    (member) =>
                      member.status === "Approved" &&
                      (isOwner || member.role === "Member"),
                  )
                  .map((member) => ({
                    id: member.appUserId,
                    displayName: member.displayName,
                    email: member.email,
                    active: true,
                  }))}
              />
            </Modal.Body>
          </Modal>
        </>
      )}
    </section>
  );
}

function getRoleLabel(role: string) {
  switch (role) {
    case "Owner":
      return "Ägare";
    case "Admin":
      return "Admin";
    case "Member":
      return "Medlem";
    default:
      return role;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "Approved":
      return "Godkänd";
    case "PendingApproval":
      return "Väntar";
    case "Rejected":
      return "Avvisad";
    case "Disabled":
      return "Inaktiverad";
    default:
      return status;
  }
}
