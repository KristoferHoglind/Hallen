import { useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import type { Player } from "../../players/types/player";

type CreateGameSessionInput = {
  name: string;
  startsAt: string;
  numberOfTeams: number;
  playerIds: string[];
};

type CreateGameSessionFormProps = {
  activePlayers: Player[];
  isSaving: boolean;
  onCreateGameSession: (input: CreateGameSessionInput) => Promise<void>;
};

type CreateGameSessionFormFieldsProps = CreateGameSessionFormProps;

export function CreateGameSessionForm({
  activePlayers,
  isSaving,
  onCreateGameSession,
}: CreateGameSessionFormProps) {
  const activePlayerKey = useMemo(() => {
    return activePlayers.map((player) => player.id).join("|");
  }, [activePlayers]);

  return (
    <CreateGameSessionFormFields
      key={activePlayerKey}
      activePlayers={activePlayers}
      isSaving={isSaving}
      onCreateGameSession={onCreateGameSession}
    />
  );
}

function CreateGameSessionFormFields({
  activePlayers,
  isSaving,
  onCreateGameSession,
}: CreateGameSessionFormFieldsProps) {
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    activePlayers.map((player) => player.id),
  );

  function toggleSelectedPlayer(playerId: string) {
    setSelectedPlayerIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }

      return [...current, playerId];
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    await onCreateGameSession({
      name,
      startsAt,
      numberOfTeams,
      playerIds: selectedPlayerIds,
    });

    setName("");
    setStartsAt("");
    setNumberOfTeams(2);
    setSelectedPlayerIds(activePlayers.map((player) => player.id));
  }

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Form.Group className="mb-3" controlId="gameSessionName">
        <Form.Label>Namn</Form.Label>
        <Form.Control
          type="text"
          placeholder="Ex. Söndagsmatchen"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSaving}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="gameSessionStartsAt">
        <Form.Label>Starttid</Form.Label>
        <Form.Control
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          disabled={isSaving}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Antal lag</Form.Label>
        <Form.Control
          type="number"
          min={2}
          value={numberOfTeams}
          onChange={(event) => setNumberOfTeams(Number(event.target.value))}
          disabled={isSaving}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Deltagare</Form.Label>

        {activePlayers.length === 0 ? (
          <p className="text-muted mb-0">
            Det finns inga aktiva spelare i gruppen.
          </p>
        ) : (
          <div className="d-flex flex-column gap-2">
            {activePlayers.map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id);

              return (
                <button
                  key={player.id}
                  type="button"
                  className={`text-start border rounded-3 px-3 py-2 ${
                    isSelected
                      ? "border-primary bg-primary-subtle text-dark"
                      : "border-secondary-subtle bg-white text-dark"
                  }`}
                  onClick={() => toggleSelectedPlayer(player.id)}
                  disabled={isSaving}
                >
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <span className="fw-semibold">{player.name}</span>

                    {isSelected ? (
                      <i
                        className="bi bi-check-circle-fill text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <i
                        className="bi bi-circle text-muted"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="text-muted small mt-2">
          Valda spelare: {selectedPlayerIds.length}
        </div>
      </Form.Group>

      <Button
        type="submit"
        disabled={
          isSaving ||
          !name.trim() ||
          !startsAt ||
          selectedPlayerIds.length === 0
        }
      >
        {isSaving ? "Sparar..." : "Skapa spelkväll"}
      </Button>
    </Form>
  );
}