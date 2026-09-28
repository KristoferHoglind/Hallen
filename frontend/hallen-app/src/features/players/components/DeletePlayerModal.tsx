import { Button, Modal } from "react-bootstrap";
import type { Player } from "../types/player";

type DeletePlayerModalProps = {
  player: Player | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (playerId: string) => Promise<void>;
};

export function DeletePlayerModal({
  player,
  isDeleting,
  onClose,
  onConfirm,
}: DeletePlayerModalProps) {
  async function handleConfirm() {
    if (!player) {
      return;
    }

    await onConfirm(player.id);
  }

  return (
    <Modal show={player !== null} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ta bort spelare?</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-0">
          Är du säker på att du vill ta bort <strong>{player?.name}</strong>?
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