import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import type { GameSession } from "../types/gameSession";
import { toDateTimeLocalValue } from "../utils/gameSessionDate";

type EditGameSessionModalProps = {
  gameSession: GameSession | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: {
    id: string;
    name: string;
    startsAt: string;
  }) => Promise<void>;
};

type EditGameSessionFormProps = {
  gameSession: GameSession;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: {
    id: string;
    name: string;
    startsAt: string;
  }) => Promise<void>;
};

function EditGameSessionForm({
  gameSession,
  isSaving,
  onClose,
  onSave,
}: EditGameSessionFormProps) {
  const [name, setName] = useState(gameSession.name);
  const [startsAt, setStartsAt] = useState(
    toDateTimeLocalValue(gameSession.startsAt),
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || !startsAt) {
      return;
    }

    await onSave({
      id: gameSession.id,
      name,
      startsAt,
    });
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Modal.Header closeButton>
        <Modal.Title>Redigera spelkväll</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-3" controlId="editGameSessionName">
          <Form.Label>Namn</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="editGameSessionStartsAt">
          <Form.Label>Starttid</Form.Label>
          <Form.Control
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
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
          disabled={isSaving || !name.trim() || !startsAt}
        >
          {isSaving ? "Sparar..." : "Spara"}
        </Button>
      </Modal.Footer>
    </Form>
  );
}

export function EditGameSessionModal({
  gameSession,
  isSaving,
  onClose,
  onSave,
}: EditGameSessionModalProps) {
  return (
    <Modal show={gameSession !== null} onHide={onClose} centered>
      {gameSession && (
        <EditGameSessionForm
          key={gameSession.id}
          gameSession={gameSession}
          isSaving={isSaving}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}