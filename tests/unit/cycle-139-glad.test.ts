import { describe, it, expect } from 'vitest';
import {
  COMPANY_GLYPH,
  COMPANY_TRACE_FADES_AFTER_STEPS,
  TIC_BY_AXIS,
  companyTraceIsFresh,
  foundByCompany,
  gladOfCompanyLine,
  gladOfCompanyMemory,
  gladOpener,
} from '../../game/src/world/tic';

/**
 * Glad of the company (BACKLOG-411). The tic has had five ways to start and one ending anybody noticed —
 * the keeper. These pin the *other* ending: the decision of whether a stretch earned a beat, how long the
 * warm trace it leaves is worth leading with, and the three strings the beat is made of.
 */

describe('what ends a stretch', () => {
  it('a body ending a ritual earns the beat', () => {
    expect(foundByCompany(true, false)).toBe(true);
  });

  it('a need ending a ritual does not — the dino walked off, it was not found', () => {
    expect(foundByCompany(true, true)).toBe(false);
  });

  it('a stretch that never reached the ritual earns nothing', () => {
    expect(foundByCompany(false, false)).toBe(false);
    expect(foundByCompany(false, true)).toBe(false);
  });
});

describe('the warm trace fades', () => {
  it('is fresh the moment it is laid', () => {
    expect(companyTraceIsFresh(0)).toBe(true);
  });

  it('is fresh right up to the window and not at it', () => {
    expect(companyTraceIsFresh(COMPANY_TRACE_FADES_AFTER_STEPS - 1)).toBe(true);
    expect(companyTraceIsFresh(COMPANY_TRACE_FADES_AFTER_STEPS)).toBe(false);
    expect(companyTraceIsFresh(COMPANY_TRACE_FADES_AFTER_STEPS + 50)).toBe(false);
  });

  it('treats a negative age as stale rather than fresh', () => {
    expect(companyTraceIsFresh(-1)).toBe(false);
  });
});

describe('the strings the beat is made of', () => {
  const label = TIC_BY_AXIS.sociability.label;

  it('the memory names the ritual and who walked up', () => {
    const m = gladOfCompanyMemory(label, 'Twitch');
    expect(m).toContain(label);
    expect(m).toContain('Twitch');
  });

  it('the ticker line names both dinos and carries the glyph', () => {
    const l = gladOfCompanyLine('Rex', 'Twitch', COMPANY_GLYPH);
    expect(l).toContain('Rex');
    expect(l).toContain('Twitch');
    expect(l).toContain(COMPANY_GLYPH);
  });

  it('the greeting opener names the friend and never varies', () => {
    expect(gladOpener('Twitch')).toContain('Twitch');
    expect(gladOpener('Twitch')).toBe(gladOpener('Twitch'));
    expect(gladOpener('Pip')).not.toBe(gladOpener('Twitch'));
  });
});

/**
 * The float has to read as its own beat. If it ever collides with a tic glyph, the mark that says "the
 * ritual ended" becomes indistinguishable from the mark that says "the ritual is happening".
 */
it('the company glyph is disjoint from every tic glyph', () => {
  const ticGlyphs = Object.values(TIC_BY_AXIS).map((t) => t.glyph);
  expect(ticGlyphs).not.toContain(COMPANY_GLYPH);
});
