import { describe, it, expect } from 'vitest';
import {
  pondCompanion,
  travelsTogether,
  togetherMemory,
  togetherEvent,
  togetherLine,
  TOGETHER_BOND,
} from './together';
import { pondSwapMemory, POND_BOND } from './groveword';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, zoneById } from './zones';

describe('two who go together (BACKLOG-360)', () => {
  describe('the pair read', () => {
    it('finds the dino the leader traded pond stories with', () => {
      const mem = ['🍖 ate', pondSwapMemory('Mossback')];
      expect(pondCompanion(mem, ['Sunny', 'Mossback', 'Twitch'])).toBe('Mossback');
    });

    it('is null for a leader carrying no pond-swap memory at all', () => {
      expect(pondCompanion(['🍖 ate', '🌿 saw the pond over in the grove'], ['Sunny', 'Mossback'])).toBeNull();
    });

    it('is null when the companion it swapped with is not a candidate (crossing, or another ground)', () => {
      expect(pondCompanion([pondSwapMemory('Mossback')], ['Sunny', 'Twitch'])).toBeNull();
      expect(pondCompanion([pondSwapMemory('Mossback')], [])).toBeNull();
    });

    it('is deterministic with two eligible companions — first in candidate order, every time', () => {
      const mem = [pondSwapMemory('Twitch'), pondSwapMemory('Sunny')];
      const candidates = ['Sunny', 'Twitch'];
      const picks = Array.from({ length: 20 }, () => pondCompanion(mem, candidates));
      expect(new Set(picks).size).toBe(1);
      expect(picks[0]).toBe('Sunny'); // candidate order decides, not memory order
    });
  });

  describe('the gate on the destination', () => {
    const mem = [pondSwapMemory('Mossback')];

    it('carries the companion when the crossing is bound for the ground they bonded over', () => {
      expect(travelsTogether(GROVE_ID, GROVE_ID, mem, ['Mossback'])).toBe('Mossback');
    });

    it('carries nobody toward any other ground, companion available or not', () => {
      expect(travelsTogether(BOWL_ID, GROVE_ID, mem, ['Mossback'])).toBeNull();
      expect(travelsTogether(FERNREACH_ID, GROVE_ID, mem, ['Mossback'])).toBeNull();
    });

    it('takes the shared ground as a parameter, so a second shared-place bond is a caller change', () => {
      expect(travelsTogether(FERNREACH_ID, FERNREACH_ID, mem, ['Mossback'])).toBe('Mossback');
    });
  });

  describe('what the pair keeps', () => {
    it('the memory names the other dino and the ground', () => {
      const line = togetherMemory('Mossback', zoneById(GROVE_ID).name);
      expect(line).toContain('Mossback');
      expect(line).toContain(zoneById(GROVE_ID).name);
    });

    it('is distinct from the pond-swap memory it is built on, so neither is mistaken for the other', () => {
      expect(togetherMemory('Mossback', 'The Grove')).not.toBe(pondSwapMemory('Mossback'));
      expect(pondCompanion([togetherMemory('Mossback', 'The Grove')], ['Mossback'])).toBeNull();
    });

    it('the ticker line names both travellers and the ground', () => {
      const e = togetherEvent('Sunny', 'Mossback', 'The Grove');
      expect(e).toContain('Sunny');
      expect(e).toContain('Mossback');
      expect(e).toContain('The Grove');
    });

    it('the road bond is smaller than the bond the shared talk earns', () => {
      expect(TOGETHER_BOND).toBeGreaterThan(0);
      expect(TOGETHER_BOND).toBeLessThan(POND_BOND);
    });

    it('the companion has something to say', () => {
      expect(togetherLine().length).toBeGreaterThan(0);
    });
  });
});
