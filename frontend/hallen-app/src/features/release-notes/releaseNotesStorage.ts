const seenInMemory = new Set<string>();
const changedEvent = "hallen:release-notes-read";

export function releaseNotesKey(userId: string, releaseId: string) {
  return `hallen:release-notes:${userId}:${releaseId}`;
}

export function hasSeenRelease(userId: string, releaseId: string) {
  const key = releaseNotesKey(userId, releaseId);
  if (seenInMemory.has(key)) return true;
  try {
    return window.localStorage.getItem(key) === "read";
  } catch {
    // Keep the app usable when the browser blocks persistent storage.
    return false;
  }
}

export function markReleaseSeen(userId: string, releaseId: string) {
  const key = releaseNotesKey(userId, releaseId);
  seenInMemory.add(key);
  try {
    window.localStorage.setItem(key, "read");
  } catch {
    // The in-memory fallback still prevents repeats during this visit.
  }
  window.dispatchEvent(new Event(changedEvent));
}

export function subscribeToReleaseNotes(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changedEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changedEvent, onChange);
  };
}
