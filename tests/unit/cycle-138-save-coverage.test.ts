import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

/**
 * The save field nobody reloads (BACKLOG-498).
 *
 * `catchWarmth` (422) was declared in `SaveData`, written by the scene, and never parsed — so the lifetime
 * ceiling whose only job is to survive a reload did not, and nothing failed. The shape spec covered the
 * envelope; the per-field round-trip was left to whichever cycle happened to write an e2e that reloads.
 *
 * The fix is not one more hand-written field assertion (which is how the gap opened). It is a spec that reads
 * the interface itself: every key `SaveData` declares must appear in what `parseSave` hands back. A field
 * added to the interface and forgotten in the parser now fails a test the same day it is written.
 */

const SRC = fileURLToPath(new URL('../../game/src/world/saveGame.ts', import.meta.url));
const source = readFileSync(SRC, 'utf8');

/** The keys `SaveData` declares, read off the interface block rather than restated here. */
function declaredKeys(): string[] {
  const start = source.indexOf('export interface SaveData {');
  expect(start).toBeGreaterThan(-1);
  const end = source.indexOf('\n}', start);
  const body = source.slice(start, end);
  const keys = new Set<string>();
  for (const m of body.matchAll(/^ {2}(\w+)\??:/gm)) keys.add(m[1]);
  return [...keys];
}

/** The keys the parser's own return literal hands back. */
function restoredKeys(): string[] {
  const ret = source.lastIndexOf('\n  return {');
  expect(ret).toBeGreaterThan(-1);
  const body = source.slice(ret, source.indexOf('\n  };', ret));
  const keys = new Set<string>();
  for (const m of body.matchAll(/^ {4}(\w+)[,:]/gm)) keys.add(m[1]);
  return [...keys];
}

describe('save field coverage', () => {
  it('every field SaveData declares is restored by the parser', () => {
    const restored = new Set(restoredKeys());
    const dropped = declaredKeys().filter((k) => !restored.has(k));
    expect(dropped).toEqual([]);
  });

  it('the interface is not empty — the reader above is actually reading something', () => {
    expect(declaredKeys().length).toBeGreaterThan(30);
  });
});

describe('the two fields this cycle touched, round-tripped for real', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 0, y: 0 },
    friendship: {},
    memory: {},
    bonds: {},
    gratitude: {},
    lastTone: {},
  } as unknown as SaveData;

  it('catchWarmth survives a reload — the 422 ceiling the reload used to refund', () => {
    const data: SaveData = { ...base, catchWarmth: { Thornback: 27 } };
    expect(deserialize(serialize(data))?.catchWarmth).toEqual({ Thornback: 27 });
  });

  it('ticHaunts survives a reload — the worn ground stays worn (421)', () => {
    const data: SaveData = { ...base, ticHaunts: { Thornback: { grove: { tileX: 4, tileY: 9, drifts: 6 } } } };
    expect(deserialize(serialize(data))?.ticHaunts).toEqual({
      Thornback: { grove: { tileX: 4, tileY: 9, drifts: 6 } },
    });
  });

  it('a save that predates either field still loads', () => {
    const parsed = deserialize(serialize(base));
    expect(parsed).not.toBeNull();
    expect(parsed?.catchWarmth).toBeUndefined();
    expect(parsed?.ticHaunts).toBeUndefined();
  });

  it('a malformed haunt is refused rather than half-restored', () => {
    const raw = JSON.parse(serialize(base));
    raw.ticHaunts = { Thornback: { grove: { tileX: 4, tileY: 'nine', drifts: 6 } } };
    expect(deserialize(JSON.stringify(raw))).toBeNull();
  });
});
