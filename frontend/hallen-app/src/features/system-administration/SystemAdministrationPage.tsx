import { Nav } from "react-bootstrap";
import { NavLink, useLocation } from "react-router-dom";
import { AccountsPage } from "../accounts/AccountsPage";
import { GroupAdministration } from "./GroupAdministration";
import { AuditLogPanel } from "../security/AuditLogPanel";
import { useState } from "react";

export function SystemAdministrationPage({
  currentUserId,
  onPermissionsChanged,
}: {
  currentUserId: string;
  onPermissionsChanged: () => Promise<void>;
}) {
  const { pathname } = useLocation();
  const [showAudit, setShowAudit] = useState(false);
  return (
    <div>
      <h1 className="page-title">Systemadministration</h1>
      <Nav variant="tabs" className="mb-4" aria-label="Systemadministration">
        <Nav.Item>
          <Nav.Link as={NavLink} to="/systemadministration" end>
            Konton och lösenord
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/systemadministration/grupper">
            Gruppadministration
          </Nav.Link>
        </Nav.Item>
      </Nav>
      {pathname === "/systemadministration/grupper" ? (
        <GroupAdministration />
      ) : (
        <AccountsPage
          currentUserId={currentUserId}
          onPermissionsChanged={onPermissionsChanged}
        />
      )}
      <details
        className="mt-4"
        onToggle={(event) => setShowAudit(event.currentTarget.open)}
      >
        <summary>Administrationslogg</summary>
        {showAudit && <AuditLogPanel />}
      </details>
    </div>
  );
}
