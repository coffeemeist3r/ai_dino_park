import { describe, it, expect } from 'vitest';
import {
  REACHABILITY_REGISTER,
  SESSION_MINUTES,
  afterOneSession,
  darkEntries,
} from './reachability';
import { FOUNDING_LANDMARKS, FOUNDING_PILES, FOUNDING_PILE_STEPS, FOUNDING_RUIN } from './founding';
import { BANK_TILE, bankStep } from './bank';
import { groveTileAt, zoneChain } from './zones';
import { pileTotal } from './resource';
import { upkeepDue } from './upkeep';
import { ACTIVE_SCALE, MINUTES_PER_DAY } from './clock';

const COLS = 20;
const ROWS = 15;

describe('afterOneSession (BACKLOG-528)', () => {
  it('is pure — two calls give equal output', () => {
    expect(afterOneSession()).toEqual(afterOneSession());
  });

  it('models a span the session actually contains', () => {
    // The helper steps one in-game day. The `BACKLOG-493` register entry owns this claim; this asserts
    // the helper is entitled to lean on it rather than silently modelling a day nobody would see.
    expect(MINUTES_PER_DAY / ACTIVE_SCALE).toBeLessThanOrEqual(SESSION_MINUTES);
  });

  it('mends the founding ruin out of its own ground', () => {
    const after = afterOneSession();
    expect(after.derelict[FOUNDING_RUIN.zone]).toBe(0);
    expect(after.standing[FOUNDING_RUIN.zone]).toBeGreaterThan(0);
  });

  it('drops the mended ground a heap step, which is what bank.ts chose PILE_STEPS for', () => {
    const z = FOUNDING_RUIN.zone;
    expect(bankStep(afterOneSession().piles[z] ?? {})).toBeLessThan(bankStep(FOUNDING_PILES[z] ?? {}));
  });

  it('bills a ground for the skyline it keeps up', () => {
    const after = afterOneSession();
    const spent = zoneChain().filter(
      (z) => pileTotal(after.piles[z] ?? {}) < pileTotal(FOUNDING_PILES[z] ?? {}),
    );
    expect(spent.length).toBeGreaterThan(0);
  });
});

/**
 * The finding this cycle was opened by. Before BACKLOG-528 the founding world placed exactly one landmark
 * and it was derelict, so `upkeepDue` was zero everywhere and zero still after the mend — the whole upkeep
 * economy of BACKLOG-480 was dormant on every fresh save, calibrated to be, and documented in `upkeep.ts`
 * as a virtue. That is CHARTER v7's corollary. This is the spec that keeps it fixed.
 */
describe('the founding skyline owes something', () => {
  it('has a standing landmark on a fresh save', () => {
    expect(FOUNDING_LANDMARKS.length).toBeGreaterThan(0);
  });

  it('owes at least one unit a day once the ruin is back up', () => {
    const z = FOUNDING_RUIN.zone;
    const standing = FOUNDING_LANDMARKS.filter((l) => l.zone === z).length + 1;
    expect(upkeepDue(standing)).toBeGreaterThanOrEqual(1);
  });

  it('stands on grass, clear of every fixture the Grove pins', () => {
    for (const l of FOUNDING_LANDMARKS) {
      expect(l.zone).toBe(FOUNDING_RUIN.zone); // the assertions below are the Grove's map
      expect(groveTileAt(l.tileX, l.tileY, COLS, ROWS)).toBe('grass');
      expect([l.tileX, l.tileY]).not.toEqual([FOUNDING_RUIN.tileX, FOUNDING_RUIN.tileY]);
      expect([l.tileX, l.tileY]).not.toEqual([BANK_TILE.tileX, BANK_TILE.tileY]);
    }
  });

  it('leaves the founding piles exactly where BACKLOG-495 put them', () => {
    expect(Object.values(FOUNDING_PILE_STEPS).sort()).toEqual([1, 2, 3]);
  });
});

describe('the register, both frames', () => {
  it('ships with nothing dark', () => {
    expect(darkEntries()).toEqual([]);
  });

  it('names the frame a claim went dark on', () => {
    const entry = (holds: boolean, played: boolean) => ({
      id: `${holds}/${played}`,
      system: 's',
      fact: 'f',
      holds: () => holds,
      played: { system: 'p', holds: () => played },
    });
    expect(darkEntries([entry(true, true)])).toEqual([]);
    expect(darkEntries([entry(true, false)]).map((d) => d.frame)).toEqual(['played']);
    // A claim whose founding fact is gone reports `founded` and stops there: there is nothing to step.
    expect(darkEntries([entry(false, true)]).map((d) => d.frame)).toEqual(['founded']);
    expect(darkEntries([entry(false, false)]).map((d) => d.frame)).toEqual(['founded']);
  });

  it('carries at least one played claim, and every one of them holds', () => {
    const played = REACHABILITY_REGISTER.filter((e) => e.played);
    expect(played.length).toBeGreaterThan(0);
    for (const e of played) expect([e.id, e.played!.holds()]).toEqual([e.id, true]);
  });
});
