import { describe, it, expect } from 'vitest';
import {
  TIC_BY_AXIS,
  TIC_COMPANY_RANGE,
  ECHO_WATCH_RANGE,
  ECHO_BOND_FLOOR,
  ECHO_WATCHES_NEEDED,
  GRIEF_BOND_FLOOR,
  signatureAxis,
  signatureTic,
  watchingTic,
  picksUpTic,
  echoedTic,
  echoTicMemory,
  echoedLine,
} from '../../game/src/world/tic';
import { AXES, type Personality } from '../../game/src/ai/personality';

/**
 * A ritual that spreads (BACKLOG-407) — the first behaviour in this park to travel sideways between two
 * living dinos. What is pinned here is mostly the *band*: the watching window has to begin strictly outside
 * company range, because a dino any nearer would have broken the solitude the ritual needs and there would
 * have been nothing to watch. An off-by-one at that edge is a feature that fires where it cannot happen.
 */

const flat = (): Personality => ({
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
});

describe('the watching band', () => {
  it('begins strictly outside company range — the watcher is the friend who did NOT walk over', () => {
    expect(watchingTic(TIC_COMPANY_RANGE)).toBe(false);
    expect(watchingTic(TIC_COMPANY_RANGE + 1)).toBe(true);
  });

  it('ends at the far edge, inclusive', () => {
    expect(watchingTic(ECHO_WATCH_RANGE)).toBe(true);
    expect(watchingTic(ECHO_WATCH_RANGE + 1)).toBe(false);
  });

  it('is a band and not a radius: company range sits inside it, so the two can never both be true', () => {
    expect(ECHO_WATCH_RANGE).toBeGreaterThan(TIC_COMPANY_RANGE);
    for (let d = 0; d <= ECHO_WATCH_RANGE + 4; d++) {
      const isCompany = d <= TIC_COMPANY_RANGE;
      expect(isCompany && watchingTic(d)).toBe(false);
    }
  });
});

describe('picking a ritual up', () => {
  it('needs both bars — enough watches AND a real friendship', () => {
    expect(picksUpTic(ECHO_WATCHES_NEEDED, ECHO_BOND_FLOOR)).toBe(true);
    expect(picksUpTic(ECHO_WATCHES_NEEDED - 1, ECHO_BOND_FLOOR)).toBe(false);
    expect(picksUpTic(ECHO_WATCHES_NEEDED, ECHO_BOND_FLOOR - 1)).toBe(false);
  });

  it('a stranger watched a hundred times still learns nothing', () => {
    expect(picksUpTic(100, ECHO_BOND_FLOOR - 1)).toBe(false);
  });

  it('a close friend seen twice has not learned it yet', () => {
    expect(picksUpTic(2, 20)).toBe(false);
  });

  it('reuses the ache/comfort floor rather than inventing a second "close friend" number', () => {
    expect(ECHO_BOND_FLOOR).toBe(GRIEF_BOND_FLOOR);
  });
});

describe('the axis is the thing that travels', () => {
  it('signatureAxis picks the axis furthest from neutral', () => {
    const p = { ...flat(), bravery: 0.95 };
    expect(signatureAxis(p)).toBe('bravery');
    expect(signatureTic(p)).toBe(TIC_BY_AXIS['bravery']);
  });

  it('a flat personality falls to the first axis in AXES order, as it always did', () => {
    expect(signatureAxis(flat())).toBe(AXES[0].key);
  });

  it('signatureTic is exactly TIC_BY_AXIS[signatureAxis] for every axis — the extraction changed nothing', () => {
    for (const a of AXES) {
      const p = { ...flat(), [a.key]: 0.99 } as Personality;
      expect(signatureTic(p)).toBe(TIC_BY_AXIS[signatureAxis(p)]);
    }
  });
});

describe('the echoed ritual', () => {
  it('keeps the motion and the mark, so every downstream reader is unchanged', () => {
    for (const a of AXES) {
      const src = TIC_BY_AXIS[a.key];
      const echo = echoedTic(src);
      expect(echo.kind).toBe(src.kind);
      expect(echo.glyph).toBe(src.glyph);
    }
  });

  it('reads as borrowed — the label differs from the native one', () => {
    const src = TIC_BY_AXIS['energy'];
    expect(echoedTic(src).label).not.toBe(src.label);
    expect(echoedTic(src).label).toContain(src.label);
  });

  it('does not mutate the shared TIC_BY_AXIS entry it was built from', () => {
    const before = TIC_BY_AXIS['energy'].label;
    echoedTic(TIC_BY_AXIS['energy']);
    expect(TIC_BY_AXIS['energy'].label).toBe(before);
  });
});

describe('what the mimicry says', () => {
  it('the memory names both the ritual and who it came from', () => {
    const m = echoTicMemory('paces a fixed little path', 'Twitch');
    expect(m).toContain('paces a fixed little path');
    expect(m).toContain('Twitch');
  });

  it('the ticker line names both dinos and carries the ritual mark', () => {
    const l = echoedLine('Mossback', 'Twitch', '🐾');
    expect(l).toContain('Mossback');
    expect(l).toContain('Twitch');
    expect(l.startsWith('🐾')).toBe(true);
  });
});
