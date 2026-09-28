import { Button, Modal } from "react-bootstrap";
import type { GameSession } from "../types/gameSession";

type DeleteGameSessionModalProps = {
  gameSession: GameSession | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (gameSessionId: string) => Promise<void>;
};

export function DeleteGameSessionModal({
  gameSession,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteGameSessionModalProps) {
  async function handleConfirm() {
    if (!gameSession) {
      return;
    }

    await onConfirm(gameSession.id);
  }

  return (
    <Modal show={gameSession !== null} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ta bort spelkväll?</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-0">
          Är du säker på att du vill ta bort{" "}
          <strong>{gameSession?.name}</strong>?
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Avbryt
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isDeleting}>
          {isDeleting ? "Tar bort..." : "Ta bort"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}