import { useEffect, useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import { createResultImage } from "../utils/resultImage";
import type { GameMatch } from "../types/gameMatch";
import type { TeamStanding } from "../utils/gameMatchStandings";
import type { SessionAward } from "../utils/sessionAwards";

export function ResultExport({
  name,
  startsAt,
  standings,
  matches,
  anecdote,
  awards,
}: {
  name: string;
  startsAt?: string;
  standings: TeamStanding[];
  matches: GameMatch[];
  anecdote?: string;
  awards: SessionAward[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      const blob = await createResultImage(
        name,
        startsAt,
        standings,
        matches,
        anecdote,
        awards,
      );
      setImage({
        url: URL.createObjectURL(blob),
        file: new File([blob], "hallen-resultat.png", { type: "image/png" }),
      });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mb-3">
      <Button
        variant="outline-primary"
        disabled={busy || !matches.length}
        onClick={() => void prepare()}
      >
        <i className="bi bi-share me-2" aria-hidden="true" />
        {busy ? "Skapar resultatbild…" : "Dela resultat"}
      </Button>
      {error && !image && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}
      <Modal
        show={!!image}
        onHide={() => {
          setImage(null);
          setError("");
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Dela resultat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Spara bilden och skicka den i gruppchatten, eller dela direkt om din
            telefon stöder det.
          </p>
          {error && <Alert variant="danger">{error}</Alert>}
          {image && (
            <img
              src={image.url}
              alt={`Resultatsammanställning för ${name}`}
              className="img-fluid"
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          {image && (
            <a
              className="btn btn-primary"
              href={image.url}
              download="hallen-resultat.png"
            >
              Ladda ned PNG
            </a>
          )}
          {image && navigator.canShare?.({ files: [image.file] }) && (
            <Button
              variant="outline-primary"
              onClick={async () => {
                try {
                  await navigator.share({ files: [image.file], title: name });
                } catch (cause) {
                  if ((cause as Error).name !== "AbortError")
                    setError("Kunde inte dela bilden. Ladda ned den istället.");
                }
              }}
            >
              Dela bilden
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
