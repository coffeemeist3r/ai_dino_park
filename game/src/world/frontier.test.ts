import { describe, it, expect } from 'vitest';
import { isUnsettled, unsettledNeighbor, settleMemory, settleLine, settleEvent, UNSETTLED_BADGE } from './frontier';
import { isDeclining } from './decline';
import { zoneProsperity, prosperityTier } from './prosperity';
import { zonePopulations, ZONES, HOLLOW_ID } from './zones';
import { isShareable, RUMOR_MARK } from '../social/gossip';
import { GROVE_NEWS_TOKEN } from './groveword';
import { PLENTY_TOKEN } from './plentyword';

describe('isUnsettled (BACKLOG-474)', () => {
  it('is true only for a ground with nobody on it that has never been founded', () => {
    expect(isUnsettled(0, undefined)).toBe(true);
  });

  it('is false once anyone lives there', () => {
    expect(isUnsettled(1, undefined)).toBe(false);
    expect(isUnsettled(3, 'Twitch')).toBe(false);
  });

  it('is false for an emptied ground that was once founded — that is declining (460), not frontier', () => {
    expect(isUnsettled(0, 'Twitch')).toBe(false);
  });

  it('is false for the emptied origin ground, which records no pioneer by construction (343)', () => {
    expect(isUnsettled(0, undefined, true)).toBe(false);
  });
});

describe('unsettledNeighbor (BACKLOG-474)', () => {
  const unsettled = (z: string) => z === 'hollow' || z === 'void';

  it('returns the first unsettled neighbour in input order (deterministic, never random)', () => {
    expect(unsettledNeighbor(['grove', 'hollow', 'void'], unsettled)).toBe('hollow');
    expect(unsettledNeighbor(['void', 'hollow'], unsettled)).toBe('void');
  });

  it('is null when every neighbour is inhabited', () => {
    expect(unsettledNeighbor(['bowl', 'grove'], unsettled)).toBeNull();
    expect(unsettledNeighbor([], unsettled)).toBeNull();
  });
});

describe('the settling beat (BACKLOG-474)', () => {
  it('names the ground in the memory and the ground + dino in the ticker line', () => {
    expect(settleMemory('The Hollow')).toContain('The Hollow');
    expect(settleEvent('Twitch', 'The Hollow')).toContain('Twitch');
    expect(settleEvent('Twitch', 'The Hollow')).toContain('The Hollow');
    expect(settleLine().length).toBeGreaterThan(0);
  });

  it('the founder memory carries no other system token, so no cascade rung can claim it', () => {
    const m = settleMemory('The Hollow');
    // First-hand like every other lived memory (generic gossip may retell it — that is the point of a
    // memory). What it must never do is *look* like grove news or word of plenty and get re-spread by the
    // rung that owns that token — the `pondSwapMemory` hazard, spelled out in groveword.ts.
    expect(isShareable(m)).toBe(true);
    expect(m).not.toContain(RUMOR_MARK);
    expect(m).not.toContain(GROVE_NEWS_TOKEN);
    expect(m).not.toContain(PLENTY_TOKEN);
  });

  it('the lens badge is a non-empty read of its own', () => {
    expect(UNSETTLED_BADGE.trim().length).toBeGreaterThan(0);
  });
});

/**
 * The reads 474 deliberately did NOT rebuild. Every one of these was already correct at population 0; these
 * pin that so a later change can't quietly break the thing that made this item small.
 */
describe('a ground at population zero (BACKLOG-474 — confirm, do not rebuild)', () => {
  it('reads a prosperity of 0 and the quiet tier without special-casing', () => {
    const score = zoneProsperity({ stockpile: 0, structures: 0, heads: 0, harvested: 0 });
    expect(score).toBe(0);
    expect(prosperityTier(score)).toBe('quiet');
  });

  it('never reads as declining — an unsettled ground has lost nobody', () => {
    expect(isDeclining(0, 0)).toBe(false);
  });

  it('a founder alone in its new ground is not declining, so 464 cannot sound "gone quiet" on it', () => {
    expect(isDeclining(1, 1)).toBe(false);
  });

  it('the head-count read seeds every ZONES id, so an empty ground answers 0 rather than undefined', () => {
    const pop = zonePopulations({}, [], 'bowl');
    for (const z of ZONES) expect(pop[z.id]).toBe(0);
    expect(pop[HOLLOW_ID]).toBe(0);
  });
});
