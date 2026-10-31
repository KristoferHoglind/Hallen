import { useSyncExternalStore } from "react";
import { Alert, Button, Offcanvas, Overlay, Popover } from "react-bootstrap";
import { teamColor } from "../../../shared/utils/teamColor";
import type {
  GameSessionParticipant,
  GameSessionTeam,
} from "../types/gameSessionSetup";

const mobileQuery = "(max-width: 767px)";
function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type PlayerMoveMenuProps = {
  player: GameSessionParticipant;
  target: HTMLButtonElement;
  teams: GameSessionTeam[];
  isSaving: boolean;
  errorMessage: string | null;
  onMove: (teamId: string | null) => Promise<void>;
  onClose: () => void;
};

export function PlayerMoveMenu({
  player,
  target,
  teams,
  isSaving,
  errorMessage,
  onMove,
  onClose,
}: PlayerMoveMenuProps) {
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(mobileQuery).matches,
    () => false,
  );
  const destinations = [
    ...teams.map((team) => ({ id: team.id as string | null, name: team.name })),
    { id: null, name: "Ej placerade" },
  ];
  const choices = (
    <>
      <p className="text-muted small mb-3">Välj vart spelaren ska flyttas.</p>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <div className="player-destinations">
        {destinations.map((team) => {
          const isCurrent = player.gameTeamId === team.id;
          return (
            <Button
              key={team.id ?? "unassigned"}
              variant="light"
              className={`player-destination ${isCurrent ? "is-current" : ""}`}
              disabled={isSaving || isCurrent}
              onClick={() => void onMove(team.id)}
              autoFocus={
                !isMobile &&
                team.id ===
                  destinations.find((item) => item.id !== player.gameTeamId)?.id
              }
            >
              <span
                className="team-dot"
                style={{ background: team.id ? teamColor(team.id) : "#94a3b8" }}
                aria-hidden="true"
              />
              <span className="flex-grow-1 text-break">{team.name}</span>
              {isCurrent && (
                <>
                  <span className="small">Nuvarande</span>
                  <i className="bi bi-check-lg" aria-hidden="true" />
                </>
              )}
            </Button>
          );
        })}
      </div>
      {isSaving && (
        <p role="status" className="text-muted small mt-2 mb-0">
          Flyttar spelaren...
        </p>
      )}
    </>
  );
  if (isMobile)
    return (
      <Offcanvas
        show
        onHide={onClose}
        placement="bottom"
        className="player-move-sheet"
        aria-labelledby="movePlayerTitle"
      >
        <Offcanvas.Header closeButton={!isSaving}>
          <Offcanvas.Title id="movePlayerTitle">
            Flytta {player.playerName}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>{choices}</Offcanvas.Body>
      </Offcanvas>
    );
  return (
    <Overlay show target={target} placement="auto" rootClose onHide={onClose}>
      <Popover
        id="playerMoveMenu"
        className="player-move-popover"
        role="dialog"
        aria-labelledby="movePlayerTitle"
      >
        <Popover.Header className="d-flex justify-content-between align-items-center gap-2">
          <span id="movePlayerTitle">Flytta {player.playerName}</span>
          <button
            className="btn-close"
            aria-label="Stäng lagval"
            disabled={isSaving}
            onClick={onClose}
          />
        </Popover.Header>
        <Popover.Body>{choices}</Popover.Body>
      </Popover>
    </Overlay>
  );
}
