import { useId, useState, useSyncExternalStore } from "react";
import { Button, Form, Modal, Nav } from "react-bootstrap";
import { latestRelease, releases } from "./releases";
import {
  hasSeenRelease,
  markReleaseSeen,
  subscribeToReleaseNotes,
} from "./releaseNotesStorage";

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "long",
  timeZone: "Europe/Stockholm",
});
const formatDate = (date: string) =>
  dateFormatter.format(new Date(`${date}T12:00:00Z`));

export function ReleaseNotes({ userId }: { userId: string }) {
  const titleId = useId();
  const historyId = useId();
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const [releaseId, setReleaseId] = useState(latestRelease.id);
  const release = releases.find(({ id }) => id === releaseId) ?? latestRelease;
  const hasSeen = useSyncExternalStore(
    subscribeToReleaseNotes,
    () => hasSeenRelease(userId, latestRelease.id),
    () => true,
  );
  function close() {
    markReleaseSeen(userId, latestRelease.id);
    setManuallyOpened(false);
  }
  return (
    <>
      <Nav.Link
        as="button"
        type="button"
        eventKey="release-notes"
        className="text-start"
        active={false}
        onClick={() => {
          setReleaseId(latestRelease.id);
          setManuallyOpened(true);
        }}
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
          <time className="small text-muted" dateTime={release.date}>
            {formatDate(release.date)}
          </time>
          <h3 className="h5 mt-2">{release.title}</h3>
          <p className="text-muted mb-4">{release.introduction}</p>
          <ul className="list-unstyled mb-0">
            {release.changes.map((change) => (
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
        <Modal.Footer className="align-items-end justify-content-between gap-2 bg-body-tertiary">
          {releases.length > 1 && (
            <Form.Group controlId={historyId} className="release-notes-history">
              <Form.Label className="small fw-semibold mb-1">
                <i className="bi bi-clock-history me-2" aria-hidden="true" />
                Tidigare nyhetsbrev
              </Form.Label>
              <Form.Select
                className="rounded-3 text-truncate"
                value={release.id}
                onChange={(event) => setReleaseId(event.currentTarget.value)}
              >
                {releases.map(({ id, date, title }) => (
                  <option key={id} value={id}>
                    {id === latestRelease.id
                      ? `Senaste nyhetsbrevet · ${formatDate(date)}`
                      : `${formatDate(date)} · ${title}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Button className="ms-auto" onClick={close}>
            Nu kör vi!
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
