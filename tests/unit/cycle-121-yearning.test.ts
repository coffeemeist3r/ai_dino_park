import { describe, it, expect } from 'vitest';
import {
  markLeft,
  clearLeft,
  yearnThreshold,
  yearnedZone,
  yearnMemory,
  yearnEvent,
  yearnBookLine,
  yearnedFor,
  YEARN_DAYS,
  CURIOUS_YEARN_DAYS,
  type LeftDays,
} from '../../game/src/world/yearning';
import { bookLines } from '../../game/src/ui/lenses';
import { deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';
import type { Personality } from '../../game/src/ai/personality';

const traits = (curiosity: number): Personality => ({
  curiosity,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
});

const CHAIN = ['grove', 'fernreach', 'hollow'];

describe('BACKLOG-362 — a ground you come to miss', () => {
  it('longs for nowhere until a ground has been left long enough', () => {
    expect(yearnedZone({}, 'Mossback', 'bowl', 10, CHAIN, YEARN_DAYS)).toBeNull();
    const map: LeftDays = {};
    markLeft(map, 'Mossback', 'grove', 8);
    expect(yearnedZone(map, 'Mossback', 'bowl', 8 + YEARN_DAYS - 1, CHAIN, YEARN_DAYS)).toBeNull();
    expect(yearnedZone(map, 'Mossback', 'bowl', 8 + YEARN_DAYS, CHAIN, YEARN_DAYS)).toBe('grove');
  });

  it('misses the ground it left longest ago, and breaks a tie deterministically by chain order', () => {
    const map: LeftDays = {};
    markLeft(map, 'Mossback', 'grove', 5);
    markLeft(map, 'Mossback', 'hollow', 2);
    expect(yearnedZone(map, 'Mossback', 'bowl', 20, CHAIN, YEARN_DAYS)).toBe('hollow');

    const tied: LeftDays = {};
    markLeft(tied, 'Mossback', 'grove', 4);
    markLeft(tied, 'Mossback', 'hollow', 4);
    for (let i = 0; i < 100; i++) {
      expect(yearnedZone(tied, 'Mossback', 'bowl', 20, CHAIN, YEARN_DAYS)).toBe('grove');
    }
  });

  it('never misses the ground it is standing on, however stale the stamp', () => {
    const map: LeftDays = {};
    markLeft(map, 'Mossback', 'grove', 1);
    expect(yearnedZone(map, 'Mossback', 'grove', 99, CHAIN, YEARN_DAYS)).toBeNull();
  });

  it('never misses a ground it cannot walk to', () => {
    const map: LeftDays = {};
    markLeft(map, 'Mossback', 'hollow', 1);
    expect(yearnedZone(map, 'Mossback', 'bowl', 99, ['grove'], YEARN_DAYS)).toBeNull();
  });

  it('gives a curious dino a shorter fuse, and both eventually long', () => {
    expect(yearnThreshold(traits(0.9))).toBe(CURIOUS_YEARN_DAYS);
    expect(yearnThreshold(traits(0.1))).toBe(YEARN_DAYS);
    expect(yearnThreshold(undefined)).toBe(YEARN_DAYS);
    expect(CURIOUS_YEARN_DAYS).toBeLessThan(YEARN_DAYS);

    const map: LeftDays = {};
    markLeft(map, 'Twitch', 'grove', 0);
    expect(yearnedZone(map, 'Twitch', 'bowl', CURIOUS_YEARN_DAYS, CHAIN, yearnThreshold(traits(0.9)))).toBe('grove');
    expect(yearnedZone(map, 'Twitch', 'bowl', CURIOUS_YEARN_DAYS, CHAIN, yearnThreshold(traits(0.1)))).toBeNull();
    expect(yearnedZone(map, 'Twitch', 'bowl', YEARN_DAYS, CHAIN, yearnThreshold(traits(0.1)))).toBe('grove');
  });

  it('re-stamps on a later departure and clears on arrival', () => {
    const map: LeftDays = {};
    markLeft(map, 'Mossback', 'grove', 2);
    markLeft(map, 'Mossback', 'grove', 9);
    expect(map.Mossback.grove).toBe(9);
    clearLeft(map, 'Mossback', 'grove');
    expect(map.Mossback.grove).toBeUndefined();
    expect(() => clearLeft(map, 'Nobody', 'grove')).not.toThrow();
  });

  it('reads the current longing off the memory ring, most recent first', () => {
    expect(yearnedFor([])).toBeNull();
    expect(yearnedFor(['ate a berry', 'stacked a cairn'])).toBeNull();
    expect(yearnedFor([yearnMemory('The Grove')])).toBe('The Grove');
    expect(yearnedFor([yearnMemory('The Grove'), 'ate a berry', yearnMemory('The Hollow')])).toBe('The Hollow');
  });

  it('words the memory, the ticker and the book line', () => {
    expect(yearnMemory('The Hollow')).toContain('The Hollow');
    expect(yearnEvent('Mossback', 'The Hollow')).toBe('💭 Mossback misses The Hollow — heads back');
    expect(yearnBookLine('The Hollow')).toBe('misses The Hollow');
  });

  it('prints the book line only for a dino that misses somewhere', () => {
    const row = {
      name: 'Mossback',
      species: 'stego',
      hearts: 3,
      topBond: 10,
      role: 'none' as const,
      rumorsHeard: 0,
    };
    expect(bookLines([{ ...row, yearn: yearnBookLine('The Hollow') }]).join('\n')).toContain('misses The Hollow');
    expect(bookLines([row]).join('\n')).not.toContain('misses');
  });

  it('round-trips the departure clock in the save, and rejects a bad one', () => {
    const base = {
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    } as Record<string, unknown>;
    expect(deserialize(JSON.stringify(base))?.leftDays).toBeUndefined();
    const withDays = deserialize(JSON.stringify({ ...base, leftDays: { Mossback: { grove: 4 } } }));
    expect(withDays?.leftDays).toEqual({ Mossback: { grove: 4 } });
    expect(deserialize(JSON.stringify({ ...base, leftDays: { Mossback: { grove: 'soon' } } }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...base, leftDays: { Mossback: ['grove'] } }))).toBeNull();
  });
});
