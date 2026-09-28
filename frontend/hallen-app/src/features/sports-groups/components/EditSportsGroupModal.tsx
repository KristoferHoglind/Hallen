import { Button, Form, Modal } from "react-bootstrap";
import type { SportsGroup } from "../types/sportsGroup";

type EditSportsGroupModalProps = {
  sportsGroup: SportsGroup | null;
  name: string;
  isSaving: boolean;
  onChangeName: (name: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function EditSportsGroupModal({
  sportsGroup,
  name,
  isSaving,
  onChangeName,
  onClose,
  onSubmit,
}: EditSportsGroupModalProps) {
  return (
    <Modal show={sportsGroup !== null} onHide={onClose} centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Redigera grupp</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3" controlId="editSportsGroupName">
            <Form.Label>Namn</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(event) => onChangeName(event.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Avbryt
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Sparar..." : "Spara"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}