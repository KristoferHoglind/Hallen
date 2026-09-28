import { Button, Modal } from "react-bootstrap";
import type { GameMatch } from "../types/gameMatch";

type DeleteMatchModalProps = {
  match: GameMatch | null;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteMatchModal({
  match,
  isSaving,
  onCancel,
  onConfirm,
}: DeleteMatchModalProps) {
  return (
    <Modal show={match !== null} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Radera match</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        Är du säker på att du vill radera{" "}
        <strong>{match?.name || `match ${match?.matchNumber}`}</strong>?
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Avbryt
        </Button>

        <Button variant="danger" onClick={onConfirm} disabled={isSaving}>
          Radera
        </Button>
      </Modal.Footer>
    </Modal>
  );
}