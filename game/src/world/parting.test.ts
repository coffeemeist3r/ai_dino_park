import { describe, expect, it } from 'vitest';
import { SESSION_MIN_MS } from './departure';
import { topBy } from './homecoming';
import { GLANCE_GLYPH, partingGlance } from './parting';

const LONG = SESSION_MIN_MS + 1;

describe('BACKLOG-119 — when nobody looks up', () => {
  it('says nothing on a session too short to have been a visit', () => {
    expect(partingGlance({ Rex: 50 }, ['Rex'], SESSION_MIN_MS - 1)).toBeNull();
  });

  it('says nothing when nobody is present', () => {
    expect(partingGlance({ Rex: 50 }, [], LONG)).toBeNull();
  });

  it('says nothing in a park whose cast you have never spoken to', () => {
    // The silence is the correct answer, not a gap: a bowl with no friendship does not wave you off.
    expect(partingGlance({}, ['Rex'], LONG)).toBeNull();
    expect(partingGlance({ Rex: 0 }, ['Rex'], LONG)).toBeNull();
  });
});

describe('BACKLOG-119 — who looks up', () => {
  it('picks the closest dino that is actually present', () => {
    const p = partingGlance({ Rex: 10, Thornback: 40 }, ['Rex', 'Thornback'], LONG);
    expect(p?.name).toBe('Thornback');
  });

  it('ignores a closer dino that is not present', () => {
    // Off on another ground, or asleep — the scene filters both into `present`, and a dino that
    // is not there cannot throw you a look no matter how much it likes you.
    const p = partingGlance({ Rex: 10, Thornback: 90 }, ['Rex'], LONG);
    expect(p?.name).toBe('Rex');
  });

  it('breaks a tie with the same rule the homecoming uses, not a second one', () => {
    // Asserted against `topBy` itself rather than against a copied expectation: a re-implemented
    // tie-break that agreed today and drifted tomorrow is the defect BACKLOG-483 is filed over.
    const friendship = { Thornback: 30, Bramble: 30 };
    const p = partingGlance(friendship, ['Thornback', 'Bramble'], LONG);
    expect(p?.name).toBe(topBy(friendship)?.name);
    expect(p?.name).toBe('Bramble');
  });
});

describe('BACKLOG-119 — the line', () => {
  it('names the dino, carries the wave, and stays short', () => {
    const p = partingGlance({ Thornback: 90 }, ['Thornback'], LONG);
    expect(p!.line).toContain('Thornback');
    expect(p!.line).toContain(GLANCE_GLYPH);
    expect(p!.line.length).toBeLessThan(60);
  });

  it('grades warmth on the homecoming’s own three tiers', () => {
    const far = partingGlance({ Rex: 5 }, ['Rex'], LONG)!;
    const mid = partingGlance({ Rex: 45 }, ['Rex'], LONG)!;
    const close = partingGlance({ Rex: 90 }, ['Rex'], LONG)!;
    expect(new Set([far.line, mid.line, close.line]).size).toBe(3);
    expect(far.hearts).toBeLessThan(mid.hearts);
    expect(mid.hearts).toBeLessThan(close.hearts);
  });

  it('does not reuse an existing mark glyph', () => {
    // Two of the five hour-marks are already eyes. A third would make the family unreadable at
    // 12px, which is why this is a wave — stated as a test so a later edit cannot quietly undo it.
    expect(GLANCE_GLYPH).not.toBe('\u{1F440}'); // VIGIL_GLYPH
    expect(GLANCE_GLYPH).not.toBe('\u{1F441}'); // ROUSE_GLYPH
    expect(GLANCE_GLYPH).not.toBe('\u{1F4A4}'); // DOZE_GLYPH
    expect(GLANCE_GLYPH).not.toBe('\u{1F4AD}'); // MISSED_GLYPH
  });
});
