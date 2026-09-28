import { useState } from "react";
import { Alert, Button, Card, Form, Spinner, Table } from "react-bootstrap";
import { useSportsGroupMembers } from "../hooks/useSportsGroupMembers";
import type { SportsGroupMemberRole } from "../types/sportsGroupMember";

type SportsGroupMembersPanelProps = {
  sportsGroupId: string;
  canManage: boolean;
  isOwner: boolean;
};

export function SportsGroupMembersPanel({
  sportsGroupId,
  canManage,
  isOwner,
}: SportsGroupMembersPanelProps) {
  const {
    members,
    isLoading,
    isSaving,
    errorMessage,
    addMember,
    updateMemberRole,
    removeMember,
  } = useSportsGroupMembers(sportsGroupId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SportsGroupMemberRole>("Member");

  async function handleAddMember(event: React.FormEvent) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    await addMember(trimmedEmail, role);

    setEmail("");
    setRole("Member");
  }

  return (
    <Card className="mt-3">
      <Card.Body>
        <Card.Title>Medlemmar</Card.Title>

        {canManage && (
          <Form onSubmit={handleAddMember} className="mb-4">
            <Form.Group className="mb-3" controlId="memberEmail">
              <Form.Label>E-post</Form.Label>
              <Form.Control
                type="email"
                placeholder="namn@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSaving}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="memberRole">
              <Form.Label>Roll</Form.Label>
              <Form.Select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as SportsGroupMemberRole)
                }
                disabled={isSaving}
              >
                <option value="Member">Medlem</option>

                {isOwner && <option value="Admin">Admin</option>}
                {isOwner && <option value="Owner">Ägare</option>}
              </Form.Select>
            </Form.Group>

            <Button type="submit" disabled={isSaving || !email.trim()}>
              {isSaving ? "Sparar..." : "Lägg till medlem"}
            </Button>
          </Form>
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
                    {isOwner ? (
                      <Form.Select
                        size="sm"
                        value={member.role}
                        onChange={(event) =>
                          updateMemberRole(
                            member.id,
                            event.target.value as SportsGroupMemberRole,
                          )
                        }
                        disabled={isSaving}
                      >
                        <option value="Member">Medlem</option>
                        <option value="Admin">Admin</option>
                        <option value="Owner">Ägare</option>
                      </Form.Select>
                    ) : (
                      getRoleLabel(member.role)
                    )}
                  </td>
                  <td>{getStatusLabel(member.status)}</td>
                  {isOwner && (
                    <td className="text-end">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                        disabled={isSaving}
                      >
                        <i className="bi bi-trash" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
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