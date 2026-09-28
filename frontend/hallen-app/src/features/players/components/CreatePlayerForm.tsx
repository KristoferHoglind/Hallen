import { useState } from "react";
import { Button, Form } from "react-bootstrap";

type CreatePlayerFormProps = {
  isSaving: boolean;
  onCreatePlayer: (name: string) => Promise<void>;
};

export function CreatePlayerForm({
  isSaving,
  onCreatePlayer,
}: CreatePlayerFormProps) {
  const [newPlayerName, setNewPlayerName] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = newPlayerName.trim();

    if (!trimmedName) {
      return;
    }

    await onCreatePlayer(trimmedName);

    setNewPlayerName("");
  }

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Form.Group className="mb-3" controlId="playerName">
        <Form.Label>Namn</Form.Label>
        <Form.Control
          type="text"
          placeholder="Ex. Kristofer"
          value={newPlayerName}
          onChange={(event) => setNewPlayerName(event.target.value)}
        />
      </Form.Group>

      <Button type="submit" disabled={isSaving || !newPlayerName.trim()}>
        {isSaving ? "Sparar..." : "Lägg till spelare"}
      </Button>
    </Form>
  );
}