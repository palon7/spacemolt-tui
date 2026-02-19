import type { EventEntry } from '../state/types.js';

type Listener = (entry: EventEntry) => void;

const listeners = new Set<Listener>();

export function pushExternalEvent(entry: EventEntry): void {
  for (const fn of listeners) fn(entry);
}

export function subscribeExternalEvents(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
