import { Button, Card, Form } from "react-bootstrap";

type CreateSportsGroupCardProps = {
  newGroupName: string;
  isSaving: boolean;
  onChangeNewGroupName: (name: string) => void;
  onCreateSportsGroup: (event: React.FormEvent) => void;
};

export function CreateSportsGroupCard({
  newGroupName,
  isSaving,
  onChangeNewGroupName,
  onCreateSportsGroup,
}: CreateSportsGroupCardProps) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Skapa grupp</Card.Title>

        <Form onSubmit={onCreateSportsGroup}>
          <Form.Group className="mb-3" controlId="sportsGroupName">
            <Form.Label>Namn</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex. Söndagsinnebandy"
              value={newGroupName}
              onChange={(event) => onChangeNewGroupName(event.target.value)}
            />
          </Form.Group>

          <Button type="submit" disabled={isSaving || !newGroupName.trim()}>
            {isSaving ? "Sparar..." : "Skapa grupp"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
