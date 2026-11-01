import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { accountRequest, type Account } from "./accountsApi";
import { groupRoleLabel } from "./accountLabels";

type Candidate = {
  memberId: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
};
type Plan = {
  isLastSystemAdministrator: boolean;
  ownedGroups: {
    groupId: string;
    groupName: string;
    candidates: Candidate[];
  }[];
};

export function DeleteAccountModal({
  account,
  isCurrentUser,
  onClose,
  onDeleted,
}: {
  account: Account;
  isCurrentUser: boolean;
  onClose: () => void;
  onDeleted: (id: string) => Promise<void>;
}) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    accountRequest<Plan>(`/${account.id}/deletion`)
      .then((result) => {
        if (active) setPlan(result);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [account.id, revision]);
  function reload() {
    setLoading(true);
    setPlan(null);
    setChoices({});
    setError("");
    setRevision((current) => current + 1);
  }
  const canDelete =
    plan &&
    !plan.isLastSystemAdministrator &&
    plan.ownedGroups.every((group) =>
      group.candidates.some(
        (candidate) => candidate.memberId === choices[group.groupId],
      ),
    );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canDelete || !plan || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await accountRequest<void>(
        `/${account.id}`,
        {
          ownershipTransfers: plan.ownedGroups.map((group) => ({
            groupId: group.groupId,
            memberId: choices[group.groupId],
          })),
        },
        "DELETE",
      );
      await onDeleted(account.id);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Modal
      show
      onHide={() => {
        if (!deleting) onClose();
      }}
      backdrop={deleting ? "static" : true}
      keyboard={!deleting}
      centered
      size="lg"
      aria-labelledby="deleteAccountTitle"
    >
      <Modal.Header closeButton={!deleting}>
        <Modal.Title id="deleteAccountTitle">Ta bort konto?</Modal.Title>
      </Modal.Header>
      <Form onSubmit={(event) => void submit(event)}>
        <Modal.Body>
          <p>
            Du tar bort <strong>{account.displayName}</strong> ({account.email}
            ). Kontot och dess gruppmedlemskap tas bort permanent. Grupper,
            spelare och matchhistorik behålls.
          </p>
          <p className="small text-muted">
            Inbjudningar som kontot skapat slutar fungera. Alla ägarbyten och
            borttagningen genomförs tillsammans.
          </p>
          {isCurrentUser && (
            <Alert variant="warning">
              Det här är ditt eget konto. Du loggas ut när kontot tas bort.
            </Alert>
          )}
          {loading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner size="sm" animation="border" />
              Kontrollerar grupper och behörigheter...
            </div>
          )}
          {plan?.isLastSystemAdministrator && (
            <Alert variant="warning">
              Det sista aktiva systemadministratörskontot kan inte tas bort.
              Utse en annan systemadministratör först.
            </Alert>
          )}
          {plan && plan.ownedGroups.length > 0 && (
            <>
              <h3 className="h6">Utse nya gruppägare</h3>
              <p className="small text-muted">
                Välj en annan aktiv, godkänd medlem för varje grupp. Rollen inom
                gruppen visas efter namnet.
              </p>
              {plan.ownedGroups.map((group) => (
                <Form.Group
                  key={group.groupId}
                  controlId={`new-owner-${group.groupId}`}
                  className="mb-3"
                >
                  <Form.Label>Ny ägare för {group.groupName}</Form.Label>
                  <Form.Select
                    value={choices[group.groupId] ?? ""}
                    required
                    disabled={deleting || group.candidates.length === 0}
                    onChange={(event) =>
                      setChoices((current) => ({
                        ...current,
                        [group.groupId]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Välj ny ägare</option>
                    {group.candidates.map((candidate) => (
                      <option
                        key={candidate.memberId}
                        value={candidate.memberId}
                      >
                        {candidate.displayName} ({candidate.email}) –{" "}
                        {groupRoleLabel(candidate.role)}
                      </option>
                    ))}
                  </Form.Select>
                  {group.candidates.length === 0 && (
                    <p className="small text-danger mt-2">
                      Gruppen saknar en annan aktiv, godkänd medlem. Bjud in
                      någon till gruppen innan kontot tas bort.
                    </p>
                  )}
                </Form.Group>
              ))}
            </>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && (
            <Button
              type="button"
              variant="link"
              className="p-0"
              disabled={deleting}
              onClick={reload}
            >
              Ladda om underlaget
            </Button>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            disabled={deleting}
            onClick={onClose}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={loading || deleting || !canDelete}
          >
            {deleting ? "Tar bort..." : "Ta bort kontot"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
