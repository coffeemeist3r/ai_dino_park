import { describe, expect, it } from 'vitest';
import { KEPT_EVERY, keptBeat, keptLine, standingCandidate } from './growth';
import { grownSeatLine } from './term';
import { SAVE_VERSION, deserialize } from './saveGame';

describe('the kept habit (BACKLOG-313)', () => {
  it('shows one idle beat in four', () => {
    expect(KEPT_EVERY).toBe(4);
    expect([0, 1, 2, 3, 4, 5, 8].map(keptBeat)).toEqual([true, false, false, false, true, false, true]);
  });

  it("the book names whose habit it kept", () => {
    expect(keptLine('paces', { from: 'Bramble', label: 'hums to itself' })).toBe(
      "paces, and still Bramble's hums to itself now and then",
    );
  });
});

describe('the kept habit in the save (BACKLOG-313)', () => {
  const base = { version: SAVE_VERSION, time: { day: 1, hour: 8, minute: 0 }, player: { x: 10, y: 10 }, friendship: {}, memory: {} };
  it('round-trips, and a malformed one is a corrupt save', () => {
    const growth = { Pip: { hatchedAtMin: 0, moltedAtMin: 10, kept: { from: 'Bramble', glyph: '🎵', label: 'hums to itself' } } };
    expect(deserialize(JSON.stringify({ ...base, growth }))?.growth).toEqual(growth);
    expect(deserialize(JSON.stringify({ ...base, growth: { Pip: { hatchedAtMin: 0, kept: { from: 3 } } } }))).toBeNull();
  });
});

describe('a youngster holds no standing (BACKLOG-609)', () => {
  const pip = { name: 'Pip', zoneId: 'grove', role: 'provider', foodBanked: 2 };

  it('a youngster reads as an unbanked wanderer; an adult is unchanged; the input is not touched', () => {
    expect(standingCandidate(pip, true)).toEqual({ name: 'Pip', zoneId: 'grove', role: 'wanderer', foodBanked: 0 });
    expect(standingCandidate(pip, false)).toBe(pip);
    expect(pip.foodBanked).toBe(2);
  });

  it('the seat beat at the molt', () => {
    expect(grownSeatLine('Pip', 'Grove')).toBe("🗳️ Pip takes a seat on the Grove's council — grown now");
  });
});
