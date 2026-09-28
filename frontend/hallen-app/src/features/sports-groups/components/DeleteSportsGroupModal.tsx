import { Alert, Button, Form, Modal } from "react-bootstrap";
import type { SportsGroup } from "../types/sportsGroup";

type DeleteSportsGroupModalProps = {
  sportsGroup: SportsGroup | null;
  confirmationName: string;
  isDeleting: boolean;
  onChangeConfirmationName: (name: string) => void;
  onClose: () => void;
  onConfirmDelete: () => void;
};

export function DeleteSportsGroupModal({
  sportsGroup,
  confirmationName,
  isDeleting,
  onChangeConfirmationName,
  onClose,
  onConfirmDelete,
}: DeleteSportsGroupModalProps) {
  return (
    <Modal show={sportsGroup !== null} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ta bort grupp?</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="danger">
          Detta tar bort gruppen och all data som hör till den, inklusive
          spelare, speltillfällen, lag, matcher och resultat.
        </Alert>

        <p>
          Skriv gruppens namn för att bekräfta:
          <br />
          <strong>{sportsGroup?.name}</strong>
        </p>

        <Form.Group controlId="deleteSportsGroupConfirmation">
          <Form.Label>Gruppnamn</Form.Label>
          <Form.Control
            type="text"
            value={confirmationName}
            onChange={(event) => onChangeConfirmationName(event.target.value)}
            placeholder={sportsGroup?.name}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Avbryt
        </Button>

        <Button
          variant="danger"
          onClick={onConfirmDelete}
          disabled={isDeleting || confirmationName !== sportsGroup?.name}
        >
          {isDeleting ? "Tar bort..." : "Ta bort permanent"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}