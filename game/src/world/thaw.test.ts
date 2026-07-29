import { describe, it, expect } from 'vitest';
import { thawedThroughWinter, thawLine, thawMemory, THAW_TOKEN, THAW_LIFT } from './thaw';
import { coldMemory, neglectMemory, warmMemory, coldWordLine } from './cold';
import { remember, type MemoryStore } from '../ai/memory';

describe('spring thaw relief (BACKLOG-215)', () => {
  it('counts a dino carrying a first-hand cold-night memory (179 shiver)', () => {
    const s = remember({}, 'Rex', coldMemory());
    expect(thawedThroughWinter(s, 'Rex')).toBe(true);
  });

  it('counts a dino carrying the neglect memory (208 nobody came)', () => {
    const s = remember({}, 'Mossback', neglectMemory());
    expect(thawedThroughWinter(s, 'Mossback')).toBe(true);
  });

  it('excludes a dino the keeper warmed — it did not tough it out alone (184)', () => {
    const s = remember({}, 'Sunny', warmMemory());
    expect(thawedThroughWinter(s, 'Sunny')).toBe(false);
  });

  it('excludes a dino with no cold memory (slept warm all winter)', () => {
    expect(thawedThroughWinter({}, 'Glade')).toBe(false);
  });

  it('excludes a dino merely carrying word of ANOTHER dino\'s cold night (first-hand only)', () => {
    const s = remember({}, 'Twitch', coldWordLine('Rex'));
    expect(thawedThroughWinter(s, 'Twitch')).toBe(false);
  });

  it('the warm memory really lacks the token; both cold memories carry it (the boundary is real)', () => {
    expect(coldMemory().includes(THAW_TOKEN)).toBe(true);
    expect(neglectMemory().includes(THAW_TOKEN)).toBe(true);
    expect(warmMemory().includes(THAW_TOKEN)).toBe(false);
  });

  it('the line names the dino and the memory is a bright note', () => {
    expect(thawLine('Rex')).toContain('Rex');
    expect(thawLine('Rex')).toContain('made it through the winter');
    expect(thawMemory()).toContain('🌱');
    expect(THAW_LIFT).toBeGreaterThan(0);
  });

  it('survives a memory store that also holds unrelated entries', () => {
    let s: MemoryStore = remember({}, 'Rex', 'ate a berry');
    s = remember(s, 'Rex', coldMemory());
    s = remember(s, 'Rex', 'the season turned to spring');
    expect(thawedThroughWinter(s, 'Rex')).toBe(true);
  });
});
