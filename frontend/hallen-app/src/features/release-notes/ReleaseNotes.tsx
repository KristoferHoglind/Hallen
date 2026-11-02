import { useId, useState, useSyncExternalStore } from "react";
import { Button, Modal, Nav } from "react-bootstrap";
import { latestRelease } from "./releases";
import {
  hasSeenRelease,
  markReleaseSeen,
  subscribeToReleaseNotes,
} from "./releaseNotesStorage";

export function ReleaseNotes({ userId }: { userId: string }) {
  const titleId = useId();
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const hasSeen = useSyncExternalStore(
    subscribeToReleaseNotes,
    () => hasSeenRelease(userId, latestRelease.id),
    () => true,
  );
  function close() {
    markReleaseSeen(userId, latestRelease.id);
    setManuallyOpened(false);
  }
  const releaseDate = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeZone: "Europe/Stockholm",
  }).format(new Date(`${latestRelease.date}T12:00:00Z`));

  return (
    <>
      <Nav.Link
        as="button"
        type="button"
        eventKey="release-notes"
        className="text-start"
        active={false}
        onClick={() => setManuallyOpened(true)}
      >
        Nytt i Hallen
      </Nav.Link>
      <Modal
        className="release-notes"
        show={manuallyOpened || !hasSeen}
        onHide={close}
        centered
        scrollable
        size="lg"
        aria-labelledby={titleId}
      >
        <Modal.Header closeButton closeLabel="Stäng nyheterna">
          <Modal.Title
            as="h2"
            id={titleId}
            className="h4 d-flex align-items-center gap-2"
          >
            <img src="/favicon.svg" alt="" width="30" height="30" />
            Nytt i Hallen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <time className="small text-muted" dateTime={latestRelease.date}>
            {releaseDate}
          </time>
          <h3 className="h5 mt-2">{latestRelease.title}</h3>
          <p className="text-muted mb-4">{latestRelease.introduction}</p>
          <ul className="list-unstyled mb-0">
            {latestRelease.changes.map((change) => (
              <li key={change.title} className="d-flex gap-3 mb-4">
                <i
                  className={`bi ${change.icon} text-primary fs-5 flex-shrink-0`}
                  aria-hidden="true"
                />
                <div>
                  <h4 className="h6 mb-1">{change.title}</h4>
                  <p className="text-muted mb-0">{change.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer className="justify-content-between gap-2">
          <span className="small text-muted">
            Du hittar alltid nyheterna i menyn.
          </span>
          <Button onClick={close}>Nu kör vi!</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
