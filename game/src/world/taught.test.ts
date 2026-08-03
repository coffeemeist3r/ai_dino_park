import { describe, it, expect } from 'vitest';
import {
  markSeen,
  hasSeen,
  teachableZone,
  taughtMemory,
  taughtWordLine,
  taughtEvent,
  taughtLine,
  taughtCount,
  taughtBookLine,
  TAUGHT_BOND,
  type SeenZones,
} from './taught';
import { isShareable, RUMOR_MARK } from '../social/gossip';
import { GROVE_NEWS_TOKEN, POND_BOND } from './groveword';
import { PLENTY_TOKEN } from './plentyword';

const CHAIN = ['bowl', 'grove', 'fernreach', 'hollow'];

describe('markSeen / hasSeen (BACKLOG-364)', () => {
  it('records a ground once and reports it', () => {
    const map: SeenZones = {};
    expect(markSeen(map, 'Twitch', 'bowl')).toBe(true);
    expect(markSeen(map, 'Twitch', 'bowl')).toBe(false);
    expect(hasSeen(map, 'Twitch', 'bowl')).toBe(true);
    expect(map.Twitch).toEqual(['bowl']);
  });

  it('tracks each dino independently', () => {
    const map: SeenZones = {};
    markSeen(map, 'Twitch', 'grove');
    expect(hasSeen(map, 'Sunny', 'grove')).toBe(false);
  });
});

describe('teachableZone (BACKLOG-364)', () => {
  const map: SeenZones = { Twitch: ['bowl', 'hollow', 'grove'], Sunny: ['bowl'] };

  it('gives the first chain-order ground the speaker has seen and the listener has not', () => {
    // Twitch saw the hollow before the grove, but the chain decides — deterministic, not travel order.
    expect(teachableZone(map, 'Twitch', 'Sunny', CHAIN)).toBe('grove');
  });

  it('moves on to the next unseen ground once the first is known', () => {
    const known: SeenZones = { ...map, Sunny: ['bowl', 'grove'] };
    expect(teachableZone(known, 'Twitch', 'Sunny', CHAIN)).toBe('hollow');
  });

  it('is null when the listener has seen everything the speaker has', () => {
    expect(teachableZone({ a: ['bowl'], b: ['bowl', 'grove'] }, 'a', 'b', CHAIN)).toBeNull();
  });

  it('is null for a dino and itself', () => {
    expect(teachableZone(map, 'Twitch', 'Twitch', CHAIN)).toBeNull();
  });

  it('is null when the speaker has been nowhere the listener has not', () => {
    expect(teachableZone({}, 'a', 'b', CHAIN)).toBeNull();
  });
});

describe('the telling (BACKLOG-364)', () => {
  it('names the listener and the ground in the pride memory', () => {
    const m = taughtMemory('Sunny', 'The Hollow');
    expect(m).toContain('Sunny');
    expect(m).toContain('The Hollow');
  });

  it("the listener's word is a rumor — heard, not witnessed — so it cannot re-spread", () => {
    const w = taughtWordLine('Twitch', 'The Hollow');
    expect(w).toContain(RUMOR_MARK);
    expect(isShareable(w)).toBe(false);
  });

  it('the pride memory carries no other system token, so no cascade rung can claim it', () => {
    const m = taughtMemory('Sunny', 'The Hollow');
    expect(m).not.toContain(RUMOR_MARK);
    expect(m).not.toContain(GROVE_NEWS_TOKEN);
    expect(m).not.toContain(PLENTY_TOKEN);
  });

  it('the ticker line names teacher, learner and ground; the bubble names the ground', () => {
    const e = taughtEvent('Twitch', 'Sunny', 'The Hollow');
    expect(e).toContain('Twitch');
    expect(e).toContain('Sunny');
    expect(e).toContain('The Hollow');
    expect(taughtLine('The Hollow')).toContain('The Hollow');
  });

  it('a telling is worth less than a place you have both stood on', () => {
    expect(TAUGHT_BOND).toBeLessThan(POND_BOND);
  });
});

describe('taughtCount / taughtBookLine (BACKLOG-364)', () => {
  it('folds the ring into the ground taught most, and how many tellings it carries', () => {
    const ring = [
      taughtMemory('Sunny', 'The Hollow'),
      'you ran into Rex the raptor',
      taughtMemory('Rex', 'The Hollow'),
      taughtMemory('Glade', 'The Grove'),
    ];
    expect(taughtCount(ring)).toEqual({ zoneName: 'The Hollow', count: 2 });
  });

  it('is null for a dino that has shown nobody anything', () => {
    expect(taughtCount([])).toBeNull();
    expect(taughtCount(['you ran into Rex the raptor'])).toBeNull();
  });

  it('reads singular and plural', () => {
    expect(taughtBookLine('The Hollow', 1)).toBe('showed 1 other the way to The Hollow');
    expect(taughtBookLine('The Hollow', 3)).toBe('showed 3 others the way to The Hollow');
  });
});
