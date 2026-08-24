import { describe, it, expect } from 'vitest';
import {
  FOUNDING_BANKED,
  GOVERNANCE_OBSERVABLE_AT,
  foundingCandidates,
  foundingCouncils,
} from '../../game/src/world/founding';
import { COUNCIL_MIN_BANKS, PROVIDER_BANKS, councilSeats } from '../../game/src/ai/roles';
import { votedSpend } from '../../game/src/world/ballot';
import { seededPersonality } from '../../game/src/ai/personality';
import { zoneChain } from '../../game/src/world/zones';
import { ROSTER } from '../../game/src/entities/roster';

/**
 * The council nobody can convene (BACKLOG-497).
 *
 * Governance is the deepest stack in this park — two votes, a term, a turnover beat, a bill lean, two lens
 * glyphs and a book standing — and it rests on three constants picked in cycle 119 against a five-dino bowl.
 * Nothing said what population it was meant to be *observable* at, and nothing asserted the shipping roster
 * cleared it; 492 found out by hand that it did not. These are the pins that make the next tuning pass to
 * the cast, the banking rate or the seat cap fail loudly instead of taking politics dormant in silence.
 */

describe('the claim and the constants', () => {
  it('states a population that actually seats two voices', () => {
    expect(
      councilSeats(GOVERNANCE_OBSERVABLE_AT.residents, GOVERNANCE_OBSERVABLE_AT.residents),
    ).toBeGreaterThanOrEqual(2);
  });

  it('states an eligibility bar the seat rule agrees with', () => {
    expect(GOVERNANCE_OBSERVABLE_AT.banked).toBe(COUNCIL_MIN_BANKS);
  });
});

describe('the roster the park actually boots into', () => {
  const candidates = foundingCandidates();

  it('has one entry per roster dino, carrying its spawn ground', () => {
    expect(candidates.length).toBe(ROSTER.length);
    for (const r of ROSTER) {
      const c = candidates.find((x) => x.name === r.name);
      expect(c).toBeDefined();
      expect(c!.zoneId).toBe(r.zone ?? 'bowl');
    }
  });

  it('reads an unbanked dino as zero rather than dropping it', () => {
    const unbanked = candidates.filter((c) => !(c.name in FOUNDING_BANKED));
    expect(unbanked.length).toBeGreaterThan(0);
    for (const c of unbanked) expect(c.foodBanked).toBe(0);
  });
});

describe('the founding seating', () => {
  const councils = foundingCouncils();

  it('covers every ground in the chain — an empty seating is a claim, not an absence', () => {
    expect(Object.keys(councils).sort()).toEqual([...zoneChain()].sort());
  });

  /** The floor 492 established: somebody, somewhere, can hold a call at all. */
  it('seats at least one council on a fresh save', () => {
    expect(Object.values(councils).some((seats) => seats.length > 0)).toBe(true);
  });

  /**
   * **The reachability pin (CHARTER v7).** A one-seat council is the provider role wearing a different
   * glyph — the majority arithmetic (487), the tie-break, and any call that can split need two. If a later
   * tuning pass to the cast size, the banking rate or the seat cap drops every ground back to one seat,
   * every one of those goes unobservable on every save a new player will ever open, silently, with the rest
   * of the suite green. This test is the thing that says so.
   */
  it('seats at least one council that can disagree', () => {
    const contested = Object.values(councils).filter((seats) => seats.length >= 2);
    expect(contested.length).toBeGreaterThan(0);
  });

  it('seats a council, not a provider in a council badge', () => {
    for (const seats of Object.values(councils)) {
      for (const name of seats) expect(FOUNDING_BANKED[name] ?? 0).toBeLessThan(PROVIDER_BANKS);
    }
  });

  /**
   * "Can disagree" as arithmetic rather than prose: the two-seat ground's seats cast opposite pantry
   * ballots on their own unshaded traits, so the ground's first call is decided by a count and not by one
   * temperament that the other seat happens to echo.
   */
  it('and its seats actually want different things', () => {
    const contested = Object.values(councils).find((seats) => seats.length >= 2)!;
    const ballots = new Set(contested.map((n) => votedSpend(seededPersonality(n))));
    expect(ballots.size).toBeGreaterThan(1);
  });
});
