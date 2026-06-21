import { describe, it, expect } from 'vitest';
import { fidget, IDLE_QUIRKS } from '../../game/src/world/fidget';
import { ACTIVITY_GLYPH } from '../../game/src/world/activity';
import { seededPersonality, type Personality } from '../../game/src/ai/personality';

const NEUTRAL: Personality = {
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
};

describe('idle fidgets (BACKLOG-298)', () => {
  it('is deterministic — same personality, same quirk', () => {
    const p = seededPersonality('Rex');
    expect(fidget(p)).toEqual(fidget(p));
  });

  it('picks the dominant axis: bold-dominant paces, timid-dominant peeks', () => {
    const bold: Personality = { ...NEUTRAL, bravery: 0.95 };
    const timid: Personality = { ...NEUTRAL, bravery: 0.05 };
    expect(fidget(bold)).toEqual(IDLE_QUIRKS.bravery.high); // 🐾 paces
    expect(fidget(timid)).toEqual(IDLE_QUIRKS.bravery.low); // 🫣 peeks
  });

  it('reads whichever trait is furthest from neutral, not just bravery', () => {
    const curious: Personality = { ...NEUTRAL, curiosity: 0.9, bravery: 0.55 };
    expect(fidget(curious)).toEqual(IDLE_QUIRKS.curiosity.high); // 👆 pokes the glass
  });

  it('the founding cast is not uniform — at least 3 distinct quirk glyphs', () => {
    const cast = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];
    const glyphs = new Set(cast.map((n) => fidget(seededPersonality(n)).glyph));
    expect(glyphs.size).toBeGreaterThanOrEqual(3);
  });

  it('no quirk glyph collides with a 295 activity glyph', () => {
    const activityGlyphs = new Set(Object.values(ACTIVITY_GLYPH));
    for (const axis of Object.values(IDLE_QUIRKS)) {
      expect(activityGlyphs.has(axis.low.glyph)).toBe(false);
      expect(activityGlyphs.has(axis.high.glyph)).toBe(false);
    }
  });
});
