import { useEffect, useState } from "react";
import { Alert, Form, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getSportsGroups } from "../../sports-groups/api/sportsGroupsApi";
import type { SportsGroup } from "../../sports-groups/types/sportsGroup";
import { SportsGroupMembersPanel } from "./SportsGroupMembersPanel";

export function MembersPage() {
  const [groups, setGroups] = useState<SportsGroup[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await getSportsGroups();
        if (!active) return;
        const sorted = [...result].sort((a, b) =>
          a.name.localeCompare(b.name, "sv"),
        );
        setGroups(sorted);
        setSelectedId(sorted[0]?.id ?? "");
      } catch {
        if (active) setError("Kunde inte hämta grupper.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  const group = groups.find((item) => item.id === selectedId);
  return (
    <section>
      <h1 className="page-title mb-2">Medlemmar och behörigheter</h1>
      <p className="text-muted mb-4">
        Hantera vilka som har tillgång till gruppen och vad de får göra.
      </p>
      {isLoading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          Laddar grupper...
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : groups.length === 0 ? (
        <p>
          Det finns inga grupper ännu. <Link to="/grupper">Skapa en grupp</Link>{" "}
          för att lägga till medlemmar.
        </p>
      ) : (
        <>
          <Form.Group controlId="membersGroup" className="group-picker">
            <Form.Label>Grupp</Form.Label>
            <Form.Select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {group && (
            <SportsGroupMembersPanel
              key={group.id}
              sportsGroupId={group.id}
              canManage={group.canManage}
              isOwner={group.isOwner}
            />
          )}
        </>
      )}
    </section>
  );
}
