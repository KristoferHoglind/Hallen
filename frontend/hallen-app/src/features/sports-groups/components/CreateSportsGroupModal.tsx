import { Alert, Button, Form, Modal } from "react-bootstrap";

type CreateSportsGroupModalProps = {
  show: boolean;
  name: string;
  isSaving: boolean;
  errorMessage: string | null;
  onChangeName: (name: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

export function CreateSportsGroupModal({
  show,
  name,
  isSaving,
  errorMessage,
  onChangeName,
  onSubmit,
  onClose,
}: CreateSportsGroupModalProps) {
  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop={isSaving ? "static" : true}
      keyboard={!isSaving}
      aria-labelledby="createGroupTitle"
    >
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton={!isSaving}>
          <Modal.Title id="createGroupTitle">Skapa ny spelargrupp</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form.Group controlId="newSportsGroupName">
            <Form.Label>Gruppnamn</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex. Söndagsinnebandy"
              value={name}
              onChange={(event) => onChangeName(event.target.value)}
              autoFocus
              required
              disabled={isSaving}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isSaving || !name.trim()}>
            {isSaving ? "Skapar..." : "Skapa grupp"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
