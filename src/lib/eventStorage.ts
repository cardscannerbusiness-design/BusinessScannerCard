export type StoredEvent = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
};

const EVENTS_STORAGE_KEY = "cs-events";
const LAST_EVENT_NAME_KEY = "cs-last-event-name";

function readEventsRaw(): StoredEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const name = String(record.name || "").trim();
        if (!name) return null;
        return {
          id: String(record.id || crypto.randomUUID()),
          name,
          createdAt: String(record.createdAt || new Date().toISOString()),
          lastUsedAt: record.lastUsedAt ? String(record.lastUsedAt) : undefined,
        } satisfies StoredEvent;
      })
      .filter((item): item is StoredEvent => item !== null);
  } catch {
    return [];
  }
}

function writeEvents(events: StoredEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("cs-events-updated"));
}

export function loadEvents(): StoredEvent[] {
  return readEventsRaw().sort((a, b) => {
    const aTime = a.lastUsedAt || a.createdAt;
    const bTime = b.lastUsedAt || b.createdAt;
    return bTime.localeCompare(aTime);
  });
}

export function getLastUsedEventName(): string {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(LAST_EVENT_NAME_KEY) || "").trim();
}

export function setLastUsedEventName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) {
    localStorage.removeItem(LAST_EVENT_NAME_KEY);
    return;
  }
  localStorage.setItem(LAST_EVENT_NAME_KEY, trimmed);
}

/** Register or refresh an event name and remember it as the active default. */
export function rememberEvent(eventName: string): StoredEvent {
  const name = eventName.trim();
  if (!name) {
    throw new Error("Event name is required.");
  }

  const now = new Date().toISOString();
  const events = readEventsRaw();
  const existing = events.find((event) => event.name.toLowerCase() === name.toLowerCase());

  let saved: StoredEvent;
  if (existing) {
    saved = { ...existing, name, lastUsedAt: now };
    const next = events.map((event) =>
      event.id === existing.id ? saved : event,
    );
    writeEvents(next);
  } else {
    saved = { id: crypto.randomUUID(), name, createdAt: now, lastUsedAt: now };
    writeEvents([saved, ...events]);
  }

  setLastUsedEventName(name);
  return saved;
}

export function resolveEventForSave(eventName: string): {
  eventName: string;
  eventId?: string;
} {
  const saved = rememberEvent(eventName);
  return { eventName: saved.name, eventId: saved.id };
}

export function listEventNames(): string[] {
  return loadEvents().map((event) => event.name);
}

const EXAMPLE_EVENT_NAME = "Mall Opening";

/** Placeholder text only — not inserted into Zoho or the Events list. */
export function getExampleEventName(): string {
  return EXAMPLE_EVENT_NAME;
}

/** Remove legacy auto-seeded example folder when it has no matching leads. */
export function purgeOrphanExampleEvent(contacts: { eventName?: string }[]): void {
  const key = EXAMPLE_EVENT_NAME.toLowerCase();
  const hasLead = contacts.some(
    (c) => (c.eventName || "").trim().toLowerCase() === key,
  );
  if (hasLead) return;

  const events = readEventsRaw();
  const next = events.filter((e) => e.name.trim().toLowerCase() !== key);
  if (next.length === events.length) return;
  writeEvents(next);
  if (getLastUsedEventName().trim().toLowerCase() === key) {
    setLastUsedEventName("");
  }
}
