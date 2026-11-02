import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import { getPlayersBySportsGroup } from "../../players/api/playersApi";
import type { Player } from "../../players/types/player";
import type { GameSessionParticipant } from "../types/gameSessionSetup";

type Props = {
  sportsGroupId: string;
  participants: GameSessionParticipant[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (playerIds: string[]) => Promise<boolean>;
};

export function EditSessionPlayersModal({
  sportsGroupId,
  participants,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState(() =>
    participants.map((p) => p.playerId),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    let active = true;
    getPlayersBySportsGroup(sportsGroupId)
      .then((result) => {
        if (active) setPlayers(result);
      })
      .catch(() => {
        if (active)
          setError("Kunde inte hämta gruppens spelare. Stäng och försök igen.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sportsGroupId]);

  const currentIds = new Set(participants.map((p) => p.playerId));
  const available = players
    .filter((p) => p.isActive || currentIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const visible = available.filter((p) =>
    p.name.toLocaleLowerCase("sv").includes(search.toLocaleLowerCase("sv")),
  );

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (await onSave(selected)) onClose();
    else
      setError(
        "Kunde inte uppdatera deltagarna. Kontrollera att nya spelare fortfarande är aktiva och försök igen.",
      );
  }

  return (
    <Modal
      show
      onHide={() => {
        if (!isSaving) onClose();
      }}
      centered
      scrollable
      backdrop={isSaving ? "static" : true}
      keyboard={!isSaving}
    >
      <Form onSubmit={save}>
        <Modal.Header closeButton={!isSaving}>
          <Modal.Title>Ändra deltagare</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Välj vilka som är med just nu. Nya deltagare hamnar i Ej placerade.
            Spelade matcher och deras statistik påverkas inte.
          </p>
          {error && <Alert variant="danger">{error}</Alert>}
          {isLoading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <>
              <Form.Control
                type="search"
                aria-label="Sök spelare"
                placeholder="Sök spelare…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />
              <div className="d-flex flex-column gap-2">
                {visible.map((player) => (
                  <Form.Check
                    key={player.id}
                    id={`session-player-${player.id}`}
                    label={`${player.name}${player.isActive ? "" : " (inaktiv)"}`}
                    checked={selected.includes(player.id)}
                    disabled={isSaving}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(player.id)
                          ? current.filter((id) => id !== player.id)
                          : [...current, player.id],
                      )
                    }
                  />
                ))}
              </div>
              {visible.length === 0 && (
                <p className="text-muted">Inga spelare att visa.</p>
              )}
              <div className="small text-muted mt-3">
                {selected.length} deltagare valda
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={isSaving || isLoading || players.length === 0}
          >
            {isSaving ? "Sparar…" : "Spara deltagare"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
