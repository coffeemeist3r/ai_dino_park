import { describe, it, expect } from 'vitest';
import {
  watcherAside,
  watchersWithNotes,
  firstMeeting,
  recordMeeting,
  WATCHER_ASIDE_MAX,
} from '../../game/src/keeper/voice';
import { KEEPERS } from '../../game/src/keeper/keepers';
import type { Personality } from '../../game/src/ai/personality';

/**
 * BACKLOG-160 — the shading half of "dinos address the observer".
 *
 * The naming half shipped as 276/278. What is under test here is the part that did not: that what a dino
 * says depends on **which** watcher is standing there, and that it says it once rather than every time.
 */

const at = (agreeableness: number): Personality => ({
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness,
  bravery: 0.5,
});

const prickly = at(0.2);
const even = at(0.5);
const warm = at(0.8);

describe('the first-impression register', () => {
  it('has a note for every observer on the roster', () => {
    // Iterating KEEPERS rather than four literal ids is the point: this is what reddens the day a fifth
    // watcher is added mute, which is precisely the defect this cycle exists to fix for the lines.
    for (const k of KEEPERS) {
      for (const traits of [prickly, even, warm]) {
        const line = watcherAside(k.id, traits);
        expect(line).not.toBe('');
        expect(line.startsWith(' ')).toBe(true);
      }
    }
    expect(watchersWithNotes().sort()).toEqual(KEEPERS.map((k) => k.id).sort());
  });

  it('gives every observer its own line at every temperament', () => {
    const lines = KEEPERS.flatMap((k) => [prickly, even, warm].map((t) => watcherAside(k.id, t)));
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('adds nothing at all for an unknown id or none', () => {
    expect(watcherAside('vex-0', even)).toBe('');
    expect(watcherAside(undefined, even)).toBe('');
  });

  it('falls back to the plain line without traits', () => {
    expect(watcherAside('aether', undefined)).toBe(watcherAside('aether', even));
  });

  it('publishes its own longest line, computed not typed', () => {
    const longest = Math.max(
      ...KEEPERS.flatMap((k) => [prickly, even, warm].map((t) => watcherAside(k.id, t).length)),
    );
    expect(WATCHER_ASIDE_MAX).toBe(longest);
  });
});

describe('who has met whom', () => {
  it('is a first meeting until it is recorded', () => {
    expect(firstMeeting({}, 'Rex', 'aether')).toBe(true);
    const met = recordMeeting({}, 'Rex', 'aether');
    expect(firstMeeting(met, 'Rex', 'aether')).toBe(false);
  });

  it('re-arms when the watcher changes — keyed by which chassis, not by "has met"', () => {
    const met = recordMeeting({}, 'Rex', 'aether');
    expect(firstMeeting(met, 'Rex', 'kestrel')).toBe(true);
  });

  it('does not mutate the map it is given', () => {
    const before = {};
    const after = recordMeeting(before, 'Rex', 'aether');
    expect(before).toEqual({});
    expect(after).not.toBe(before);
  });
});
