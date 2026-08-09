import { describe, it, expect } from 'vitest';
import {
  KEEPSAKE,
  STRUCK_MARK,
  STRUCK_ROLLS,
  clearCameFrom,
  isStruck,
  keepsakeGlyph,
  markCameFrom,
  struckBookLine,
  struckEvent,
  struckLine,
  struckMemory,
  type CameFrom,
} from './struck';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, HOLLOW_ID, ZONES } from './zones';
import { PLENTY_TOKEN } from './plentyword';
import { groveNewsMemory } from './groveword';

/** BACKLOG-347 — still full of the place it left. */
describe('keepsakeGlyph', () => {
  it('gives every ground its own glyph', () => {
    const glyphs = ZONES.map((z) => keepsakeGlyph(z.id));
    // BACKLOG-478: this listed the four grounds by hand, so a fifth ZONES row failed it by construction.
    expect(glyphs).toEqual(ZONES.map((z) => KEEPSAKE[z.id]));
    expect(new Set(glyphs).size).toBe(ZONES.length); // all distinct — the ground is legible from the bubble
  });

  it('falls back to the leaf for a ground with no glyph of its own', () => {
    expect(keepsakeGlyph('atlantis')).toBe('🌿');
  });
});

describe('isStruck', () => {
  it('holds for the window after a crossing and lapses after it', () => {
    const map: CameFrom = {};
    markCameFrom(map, 'Mossback', GROVE_ID);
    for (let rolls = 0; rolls < STRUCK_ROLLS; rolls++) {
      expect(isStruck(rolls, map['Mossback'])).toBe(true);
    }
    expect(isStruck(STRUCK_ROLLS, map['Mossback'])).toBe(false);
    expect(isStruck(STRUCK_ROLLS + 9, map['Mossback'])).toBe(false);
  });

  it('is never true for a dino that has never crossed', () => {
    const map: CameFrom = {};
    for (let rolls = 0; rolls <= STRUCK_ROLLS + 1; rolls++) {
      expect(isStruck(rolls, map['Sunny'])).toBe(false);
    }
  });

  it('is false again once the record is cleared', () => {
    const map: CameFrom = {};
    markCameFrom(map, 'Twitch', BOWL_ID);
    clearCameFrom(map, 'Twitch');
    expect(isStruck(0, map['Twitch'])).toBe(false);
  });

  it('records only the last ground left', () => {
    const map: CameFrom = {};
    markCameFrom(map, 'Rex', BOWL_ID);
    markCameFrom(map, 'Rex', FERNREACH_ID);
    expect(map['Rex']).toBe(FERNREACH_ID);
  });

  it('reads false at a homecoming tenure (452 restores SETTLE_ROLLS — the 🏡 beat owns that moment)', () => {
    const map: CameFrom = {};
    markCameFrom(map, 'Glade', HOLLOW_ID);
    expect(isStruck(4, map['Glade'])).toBe(false); // SETTLE_ROLLS = 4 > STRUCK_ROLLS
  });
});

describe('the lines', () => {
  it('names the ground and carries the mark', () => {
    const m = struckMemory('The Grove');
    expect(m).toContain('The Grove');
    expect(m.startsWith(STRUCK_MARK)).toBe(true);
  });

  it('carries no other system’s token — it must not be re-spread as news', () => {
    for (const z of ZONES) {
      const m = struckMemory(z.name);
      expect(m).not.toContain(PLENTY_TOKEN); // word of plenty (458)
      expect(m).not.toContain(groveNewsMemory()); // grove news (342)
      expect(m).not.toContain('the pond'); // the grove-pull phrase (345/355)
    }
  });

  it('floats the keepsake glyph and logs the ground by name', () => {
    expect(struckLine(keepsakeGlyph(HOLLOW_ID))).toBe(KEEPSAKE[HOLLOW_ID]);
    const e = struckEvent('Mossback', 'The Hollow', KEEPSAKE[HOLLOW_ID]);
    expect(e).toContain('Mossback');
    expect(e).toContain('The Hollow');
    expect(e.startsWith(KEEPSAKE[HOLLOW_ID])).toBe(true);
  });

  it('reads plainly in the book', () => {
    expect(struckBookLine('The Fernreach')).toBe('just back from The Fernreach');
  });
});
