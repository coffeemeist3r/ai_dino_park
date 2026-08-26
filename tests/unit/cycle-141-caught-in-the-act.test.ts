import { describe, it, expect } from 'vitest';
import { ACTIVITY_ASIDES, ACTIVITY_GLYPH, activityAside, type Activity } from '../../game/src/world/activity';
import { ROSTER } from '../../game/src/entities/roster';

const ACTIVITIES = Object.keys(ACTIVITY_GLYPH) as Activity[];
const NAMES = ROSTER.map((r) => r.name);

describe('the clause for what you interrupted (BACKLOG-300)', () => {
  it('names every activity but wandering', () => {
    for (const a of ACTIVITIES) {
      const line = activityAside(a, 'Bramble');
      if (a === 'wandering') expect(line).toBeNull();
      else expect(line, `${a} has no clause`).toBeTruthy();
    }
  });

  /**
   * A dino that was doing nothing in particular greets exactly as it did before this shipped. That is what
   * makes the beat mean something when it fires — and it is why the plain greet has no regression surface.
   */
  it('says nothing at all about a wanderer, for every name in the cast', () => {
    for (const n of NAMES) expect(activityAside('wandering', n)).toBeNull();
  });

  it('words it the same way for the same dino every time — a tell you can learn', () => {
    for (const n of NAMES) {
      const first = activityAside('feeding', n);
      expect(activityAside('feeding', n)).toBe(first);
      expect(activityAside('feeding', n)).toBe(first);
    }
  });

  it('does not make the whole cast sound alike', () => {
    const spoken = new Set(NAMES.map((n) => activityAside('feeding', n)));
    expect(spoken.size).toBeGreaterThan(1);
  });

  it('draws only from its own activity’s phrasings', () => {
    for (const a of ACTIVITIES) {
      const line = activityAside(a, 'Bramble');
      if (line) expect(ACTIVITY_ASIDES[a]).toContain(line);
    }
  });

  /**
   * The composition invariant, exercised as the pure join `pickTone` performs. An opener (408/413/420), an
   * aside (423 or 300) and the reply, in any combination, land single-spaced with no leading or trailing
   * space — structural rather than something a test hopes for.
   */
  it('joins opener + aside + reply single-spaced whatever is present', () => {
    const compose = (opener: string | null, aside: string | null, reply: string) =>
      [opener, aside, reply].filter(Boolean).join(' ');
    const cases = [
      ['Caught mid-fidget,', activityAside('huddling', 'Bramble'), 'Hello there.'],
      [null, activityAside('gathering', 'Pip'), 'Hello there.'],
      ['Caught mid-fidget,', null, 'Hello there.'],
      [null, null, 'Hello there.'],
    ] as [string | null, string | null, string][];
    for (const [o, a, r] of cases) {
      const line = compose(o, a, r);
      expect(line).not.toMatch(/ {2}/);
      expect(line).toBe(line.trim());
      expect(line).toContain(r);
    }
  });
});
