import type { Membership } from "./accountsApi";

import { groupRoleLabel } from "./accountLabels";
const statusLabel = (status: string) =>
  ({
    Approved: "Godkänd",
    PendingApproval: "Väntar på godkännande",
    Rejected: "Avvisad",
    Disabled: "Inaktiverad",
  })[status] ?? status;

export function AccountMemberships({
  memberships,
}: {
  memberships: Membership[];
}) {
  return (
    <div className="pt-3">
      {memberships.length === 0 ? (
        <p className="text-muted small mb-0">
          Kontot har inga gruppmedlemskap.
        </p>
      ) : (
        <ul className="list-unstyled mb-0">
          {memberships.map((membership) => (
            <li
              key={membership.groupId}
              className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 py-2"
            >
              <span className="fw-semibold">{membership.groupName}</span>
              <span className="small text-muted">
                {groupRoleLabel(membership.role)} ·{" "}
                {statusLabel(membership.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
