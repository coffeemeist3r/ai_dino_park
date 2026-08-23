import { describe, it, expect } from 'vitest';
import {
  driftHaunt,
  hauntDistance,
  hauntDriftMemory,
  hauntSeed,
  hauntWorthNoting,
  ticAnchorFor,
  HAUNT_DRIFT_NOTED,
  HAUNT_RETURN_RANGE,
  type Haunt,
} from '../../game/src/world/tic';

/**
 * The ritual drifts (BACKLOG-421). The tic's anchor was never a pin — it was re-chosen from wherever the
 * wander dropped the dino, thrown away by `resetTic`, and therefore had no relationship to the last time.
 * These specs pin the thing that replaces it: a haunt the ritual returns to, one tile of drift per stretch,
 * and a re-seat when the dino has wandered too far to bother walking back.
 */

const COLS = 20;
const ROWS = 15;
const SEED = hauntSeed('Thornback');

describe('driftHaunt', () => {
  it('moves exactly one tile and counts the drift', () => {
    const h: Haunt = { tileX: 10, tileY: 7, drifts: 0 };
    const next = driftHaunt(h, SEED, COLS, ROWS);
    expect(hauntDistance(h, next)).toBe(1);
    expect(next.drifts).toBe(1);
  });

  it('is deterministic — the same haunt drifts the same way every time', () => {
    const h: Haunt = { tileX: 4, tileY: 4, drifts: 3 };
    expect(driftHaunt(h, SEED, COLS, ROWS)).toEqual(driftHaunt(h, SEED, COLS, ROWS));
  });

  it('two dinos wear their own paths — the drift is name-seeded, not shared', () => {
    const h: Haunt = { tileX: 9, tileY: 9, drifts: 0 };
    const walk = (name: string) => {
      let cur = h;
      const path: string[] = [];
      for (let i = 0; i < 6; i++) {
        cur = driftHaunt(cur, hauntSeed(name), COLS, ROWS);
        path.push(`${cur.tileX},${cur.tileY}`);
      }
      return path.join(' ');
    };
    expect(walk('Thornback')).not.toEqual(walk('Mossback'));
  });

  it('stays on the grid from either corner, however long it walks', () => {
    for (const start of [
      { tileX: 0, tileY: 0, drifts: 0 },
      { tileX: COLS - 1, tileY: ROWS - 1, drifts: 0 },
    ] as Haunt[]) {
      let cur = start;
      for (let i = 0; i < 20; i++) {
        cur = driftHaunt(cur, SEED, COLS, ROWS);
        expect(cur.tileX).toBeGreaterThanOrEqual(0);
        expect(cur.tileX).toBeLessThan(COLS);
        expect(cur.tileY).toBeGreaterThanOrEqual(0);
        expect(cur.tileY).toBeLessThan(ROWS);
      }
    }
  });

  it('meanders — four drifts in a row are not all the same step', () => {
    let cur: Haunt = { tileX: 10, tileY: 7, drifts: 0 };
    const deltas = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const next = driftHaunt(cur, SEED, COLS, ROWS);
      deltas.add(`${next.tileX - cur.tileX},${next.tileY - cur.tileY}`);
      cur = next;
    }
    expect(deltas.size).toBeGreaterThan(1);
  });
});

describe('ticAnchorFor', () => {
  const at = { tileX: 10, tileY: 7 };

  it('a first stretch anchors where the dino stands — the pre-421 behaviour, unchanged', () => {
    const { anchor, haunt } = ticAnchorFor({ haunt: undefined, at, seed: SEED, cols: COLS, rows: ROWS });
    expect(anchor).toEqual(at);
    expect(haunt).toEqual({ ...at, drifts: 0 });
  });

  it('a later stretch near the haunt performs one tile off it, not where the dino stands', () => {
    const haunt: Haunt = { tileX: 12, tileY: 8, drifts: 0 };
    const { anchor, haunt: next } = ticAnchorFor({ haunt, at, seed: SEED, cols: COLS, rows: ROWS });
    expect(hauntDistance(haunt, anchor)).toBe(1);
    expect(anchor).not.toEqual(at);
    expect(next.drifts).toBe(1);
  });

  it('a habit wandered away from is lost — beyond the return range the haunt re-seats underfoot', () => {
    const far: Haunt = { tileX: at.tileX + HAUNT_RETURN_RANGE + 1, tileY: at.tileY, drifts: 9 };
    const { anchor, haunt } = ticAnchorFor({ haunt: far, at, seed: SEED, cols: COLS, rows: ROWS });
    expect(anchor).toEqual(at);
    expect(haunt).toEqual({ ...at, drifts: 0 });
  });

  it('exactly at the return range it still walks back', () => {
    const edge: Haunt = { tileX: at.tileX + HAUNT_RETURN_RANGE, tileY: at.tileY, drifts: 2 };
    const { anchor } = ticAnchorFor({ haunt: edge, at, seed: SEED, cols: COLS, rows: ROWS });
    expect(anchor).not.toEqual(at);
    expect(hauntDistance(edge, anchor)).toBe(1);
  });
});

describe('the drift becomes legible', () => {
  it('is worth noting only once the path has moved HAUNT_DRIFT_NOTED times', () => {
    expect(hauntWorthNoting({ tileX: 1, tileY: 1, drifts: HAUNT_DRIFT_NOTED - 1 })).toBe(false);
    expect(hauntWorthNoting({ tileX: 1, tileY: 1, drifts: HAUNT_DRIFT_NOTED })).toBe(true);
  });

  it('the memory names the ritual it belongs to', () => {
    expect(hauntDriftMemory('paces a fixed little path')).toContain('paces a fixed little path');
  });
});
