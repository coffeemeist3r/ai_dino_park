import { describe, it, expect } from 'vitest';
import {
  gratefulMemory,
  whoClearedMyName,
  GRATITUDE_FRESH_WINDOW,
} from '../../game/src/world/cold';
import { coldMemory } from '../../game/src/world/cold';
import type { MemoryStore } from '../../game/src/ai/memory';

/**
 * Gratitude fades (BACKLOG-251). The spoken thanks (247) reads back the `<clearer> cleared my name`
 * memory, but only while it is fresh: the parser scans the most-recent GRATITUDE_FRESH_WINDOW ring
 * entries, so once that many newer memories pile on top the thanks quiets — gratitude as a passing
 * feeling, not a permanent script. The clearing is not forgotten (the memory may still ride the ring).
 */

// A filler memory that is NOT a cleared-name memory, used to bury the grateful one under newer entries.
const filler = coldMemory();
const buryUnder = (mem: string, n: number): string[] => [mem, ...Array.from({ length: n }, () => filler)];

describe('GRATITUDE_FRESH_WINDOW (BACKLOG-251)', () => {
  it('is a positive integer no larger than the memory ring (6)', () => {
    expect(Number.isInteger(GRATITUDE_FRESH_WINDOW)).toBe(true);
    expect(GRATITUDE_FRESH_WINDOW).toBeGreaterThan(0);
    expect(GRATITUDE_FRESH_WINDOW).toBeLessThanOrEqual(6);
  });
});

describe('whoClearedMyName freshness gate (BACKLOG-251)', () => {
  it('still names the clearer when the grateful memory is the newest entry (247 regression)', () => {
    const store: MemoryStore = { Mossback: [gratefulMemory('Twitch')] };
    expect(whoClearedMyName(store, 'Mossback')).toBe('Twitch');
  });

  it('still names the clearer while the grateful memory sits inside the fresh window', () => {
    // grateful memory with WINDOW-1 newer memories on top → still within the window.
    const store: MemoryStore = { Mossback: buryUnder(gratefulMemory('Twitch'), GRATITUDE_FRESH_WINDOW - 1) };
    expect(whoClearedMyName(store, 'Mossback')).toBe('Twitch');
  });

  it('quiets once exactly GRATITUDE_FRESH_WINDOW newer memories bury it — but the memory remains', () => {
    const mem = gratefulMemory('Twitch');
    const list = buryUnder(mem, GRATITUDE_FRESH_WINDOW); // grateful at position -(WINDOW+1), just outside
    const store: MemoryStore = { Mossback: list };
    expect(whoClearedMyName(store, 'Mossback')).toBeNull(); // faded
    expect(store.Mossback).toContain(mem); // not forgotten — the feeling passed, the record didn't
  });

  it('stays quiet when the grateful memory is buried well past the window', () => {
    const store: MemoryStore = { Mossback: buryUnder(gratefulMemory('Twitch'), GRATITUDE_FRESH_WINDOW + 2) };
    expect(whoClearedMyName(store, 'Mossback')).toBeNull();
  });

  it('a fresh clearer in the window wins over an older one that has faded out of it', () => {
    // older clearing (Sunny) buried out of the window, a newer clearing (Glade) inside it.
    const mems = [
      gratefulMemory('Sunny'),
      ...Array.from({ length: GRATITUDE_FRESH_WINDOW }, () => filler),
      gratefulMemory('Glade'),
    ];
    const store: MemoryStore = { Mossback: mems };
    expect(whoClearedMyName(store, 'Mossback')).toBe('Glade');
  });
});
