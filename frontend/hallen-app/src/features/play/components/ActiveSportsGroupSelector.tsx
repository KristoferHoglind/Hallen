import { Card, Form } from "react-bootstrap";
import type { SportsGroup } from "../../sports-groups/types/sportsGroup";

type ActiveSportsGroupSelectorProps = {
  sportsGroups: SportsGroup[];
  selectedSportsGroup: SportsGroup | null;
  onSelectSportsGroup: (sportsGroup: SportsGroup | null) => void;
};

export function ActiveSportsGroupSelector({
  sportsGroups,
  selectedSportsGroup,
  onSelectSportsGroup,
}: ActiveSportsGroupSelectorProps) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Form.Group controlId="activeSportsGroup">
          <Form.Label className="text-muted small">Aktiv grupp</Form.Label>
          <Form.Select
            value={selectedSportsGroup?.id ?? ""}
            onChange={(event) => {
              const selectedId = event.target.value;

              const selectedGroup =
                sportsGroups.find((group) => group.id === selectedId) ?? null;

              onSelectSportsGroup(selectedGroup);
            }}
          >
            <option value="">Välj grupp</option>

            {sportsGroups.map((sportsGroup) => (
              <option key={sportsGroup.id} value={sportsGroup.id}>
                {sportsGroup.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Card.Body>
    </Card>
  );
}