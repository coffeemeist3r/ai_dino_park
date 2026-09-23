import { describe, it, expect } from 'vitest';
import { KEEPERS, keeperById, keeperFit } from './keepers';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';
import {
  MISS_ASIDE_MAX,
  MISS_HEARTS,
  MISS_MARGIN,
  missAside,
  missesWatcher,
  switchMemory,
  watchersWithMisses,
} from './succession';

const aki = keeperById('aether');
const vix = keeperById('vanta');
const lux = keeperById('lumen');
const kes = keeperById('kestrel');

const prickly = seededPersonality('Mossback');
const warm = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.95, bravery: 0.5 };
const sour = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.05, bravery: 0.5 };
const even = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5 };

describe('missesWatcher — the two doors', () => {
  it('opens on fit alone, at zero friendship — the door a fresh save can reach', () => {
    const traits = seededPersonality('Sunny');
    expect(keeperFit(aki, traits) - keeperFit(vix, traits)).toBeGreaterThanOrEqual(MISS_MARGIN);
    expect(missesWatcher(aki, vix, traits, 0)).toBe(true);
  });

  it('opens on fondness alone, even when the new watcher suits the dino better', () => {
    const traits = seededPersonality('Sunny');
    // The reverse switch: Vix leaving for Aki is a fit *gain*, so only the hearts door can open.
    expect(keeperFit(vix, traits) - keeperFit(aki, traits)).toBeLessThan(MISS_MARGIN);
    expect(missesWatcher(vix, aki, traits, 0)).toBe(false);
    expect(missesWatcher(vix, aki, traits, MISS_HEARTS)).toBe(true);
  });

  it('stays shut when neither door opens', () => {
    expect(missesWatcher(aki, aki, even, 0)).toBe(false);
    expect(missesWatcher(aki, aki, even, MISS_HEARTS - 1)).toBe(false);
  });

  it('gives a traitless dino the hearts door only — it does not miss everyone equally', () => {
    expect(missesWatcher(aki, vix, undefined, 0)).toBe(false);
    expect(missesWatcher(aki, vix, undefined, MISS_HEARTS)).toBe(true);
  });
});

/**
 * CHARTER v7's corollary: a constant calibrated so the founding park sits inert beneath it is a defect.
 * These two recompute the claim from `ROSTER` rather than pinning numbers, so a roster change that makes
 * `MISS_MARGIN` dormant turns this red instead of turning the beat off quietly.
 */
describe('MISS_MARGIN is not a dormant constant', () => {
  it('is cleared by every founding dino on at least one ordered pair of watchers', () => {
    for (const spawn of ROSTER) {
      const traits = seededPersonality(spawn.name);
      const drops = KEEPERS.flatMap((prev) =>
        KEEPERS.filter((next) => next.id !== prev.id).map((next) => keeperFit(prev, traits) - keeperFit(next, traits)),
      );
      expect(Math.max(...drops), `${spawn.name} can never miss anybody`).toBeGreaterThanOrEqual(MISS_MARGIN);
    }
  });

  it('is cleared on the switch two keypresses from boot — Aki, the default, giving way to Vix', () => {
    const missers = ROSTER.filter((s) => missesWatcher(aki, vix, seededPersonality(s.name), 0)).map((s) => s.name);
    expect(missers.length).toBeGreaterThan(0);
    expect(missers).toContain('Sunny');
  });
});

describe('missAside', () => {
  it('has a note for every watcher on the roster, in all three shades', () => {
    expect(watchersWithMisses().sort()).toEqual(KEEPERS.map((k) => k.id).sort());
    for (const k of KEEPERS) {
      for (const traits of [sour, warm, even]) {
        expect(missAside(k.id, traits).length, `${k.id} is mute`).toBeGreaterThan(0);
      }
    }
  });

  it('names something different for each watcher — a generic line is the failure this item is about', () => {
    const plains = KEEPERS.map((k) => missAside(k.id, even));
    expect(new Set(plains).size).toBe(KEEPERS.length);
  });

  it('shades on temperament, the way every other aside register does', () => {
    expect(missAside('aether', sour)).not.toBe(missAside('aether', warm));
    expect(missAside('aether', even)).not.toBe(missAside('aether', warm));
    expect(missAside('aether', prickly)).toBe(missAside('aether', prickly));
  });

  it('adds nothing at all for no watcher — the path every pre-162 save takes', () => {
    expect(missAside(undefined, even)).toBe('');
    expect(missAside('', even)).toBe('');
    expect(missAside('no-such-watcher', even)).toBe('');
  });

  it('derives its cap from the table rather than a typed literal', () => {
    const longest = Math.max(...KEEPERS.flatMap((k) => [missAside(k.id, sour), missAside(k.id, warm), missAside(k.id, even)].map((t) => t.length)));
    expect(MISS_ASIDE_MAX).toBe(longest);
  });
});

describe('switchMemory', () => {
  it('names both watchers, so a dino can recall which one left', () => {
    const line = switchMemory(kes, lux);
    expect(line).toContain('Kes');
    expect(line).toContain('Lux');
  });
});
