import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { Player } from "../types/player";

type EditPlayerModalProps = {
  player: Player | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (playerId: string, name: string, isActive: boolean) => Promise<void>;
};

type EditPlayerFormProps = {
  player: Player;
  isSaving: boolean;
  onClose: () => void;
  onSave: (playerId: string, name: string, isActive: boolean) => Promise<void>;
};

function EditPlayerForm({
  player,
  isSaving,
  onClose,
  onSave,
}: EditPlayerFormProps) {
  const [editPlayerName, setEditPlayerName] = useState(player.name);
  const [editPlayerIsActive, setEditPlayerIsActive] = useState(
    player.isActive,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = editPlayerName.trim();

    if (!trimmedName) {
      return;
    }

    await onSave(player.id, trimmedName, editPlayerIsActive);
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Header closeButton>
        <Modal.Title>Redigera spelare</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-3" controlId="editPlayerName">
          <Form.Label>Namn</Form.Label>
          <Form.Control
            type="text"
            value={editPlayerName}
            onChange={(event) => setEditPlayerName(event.target.value)}
            autoFocus
          />
        </Form.Group>

        <Form.Check
          type="switch"
          id="editPlayerIsActive"
          label="Aktiv spelare"
          checked={editPlayerIsActive}
          onChange={(event) => setEditPlayerIsActive(event.target.checked)}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Avbryt
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSaving || !editPlayerName.trim()}
        >
          {isSaving ? "Sparar..." : "Spara"}
        </Button>
      </Modal.Footer>
    </Form>
  );
}

export function EditPlayerModal({
  player,
  isSaving,
  onClose,
  onSave,
}: EditPlayerModalProps) {
  return (
    <Modal show={player !== null} onHide={onClose} centered>
      {player && (
        <EditPlayerForm
          key={player.id}
          player={player}
          isSaving={isSaving}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}