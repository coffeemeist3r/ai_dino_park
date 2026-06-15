/**
 * NPC memory — a tiny per-dino ring buffer of recent events, fed into the
 * prompt so dinos react to history ("back again?"). Pure (no Phaser).
 */

export type MemoryStore = Record<string, string[]>;

const DEFAULT_MAX = 6;

/** Append an event for `name`, keeping only the last `maxN`. Returns a new store. */
export function remember(store: MemoryStore, name: string, event: string, maxN = DEFAULT_MAX): MemoryStore {
  const prev = store[name] ?? [];
  return { ...store, [name]: [...prev, event].slice(-maxN) };
}

export function recall(store: MemoryStore, name: string): string[] {
  return store[name] ?? [];
}

/** Remove every occurrence of `entry` from `name`'s list. Returns a new store; no mutation. */
export function forget(store: MemoryStore, name: string, entry: string): MemoryStore {
  const prev = store[name];
  if (!prev) return store;
  return { ...store, [name]: prev.filter((e) => e !== entry) };
}

/** A one-line daily reflection folded from a day's events. */
export function reflect(events: string[]): string {
  if (events.length === 0) return 'A quiet day, nothing worth remembering.';
  return `A full day — ${events.length} thing${events.length === 1 ? '' : 's'} happened, like: ${events[events.length - 1]}`;
}
