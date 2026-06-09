import { describe, it, expect } from 'vitest';
import {
  KEEPERS,
  DEFAULT_KEEPER_ID,
  keeperById,
  keeperFit,
  keeperBonus,
} from '../../game/src/keeper/keepers';
import type { Personality } from '../../game/src/ai/personality';

// Archetypes maxed/minned on the appeal axes, to prove the same observer fits different dinos differently.
const warmSocial: Personality = { curiosity: 0.5, sociability: 0.95, energy: 0.5, agreeableness: 0.95, bravery: 0.5 };
const boldFiery: Personality = { curiosity: 0.5, sociability: 0.3, energy: 0.9, agreeableness: 0.3, bravery: 0.95 };
const curiousMind: Personality = { curiosity: 0.95, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.7 };
const timidPrickly: Personality = { curiosity: 0.1, sociability: 0.2, energy: 0.15, agreeableness: 0.15, bravery: 0.05 };

const aether = keeperById('aether');
const vanta = keeperById('vanta');
const lumen = keeperById('lumen');

describe('keepers', () => {
  it('has exactly three observers, unique ids, each fully described', () => {
    expect(KEEPERS).toHaveLength(3);
    expect(new Set(KEEPERS.map((k) => k.id)).size).toBe(3);
    const axes = new Set(['curiosity', 'sociability', 'energy', 'agreeableness', 'bravery']);
    for (const k of KEEPERS) {
      expect(k.name).toBeTruthy();
      expect(k.era).toBeTruthy();
      expect(k.backstory).toBeTruthy();
      expect(k.ability.label).toBeTruthy();
      expect(k.ability.desc).toBeTruthy();
      for (const axis of Object.keys(k.ability.appeal)) expect(axes.has(axis)).toBe(true);
    }
  });

  it('DEFAULT_KEEPER_ID is the first observer', () => {
    expect(DEFAULT_KEEPER_ID).toBe(KEEPERS[0].id);
  });

  it('keeperById finds by id and falls back to the first observer for unknown/undefined', () => {
    expect(keeperById('vanta').id).toBe('vanta');
    expect(keeperById('nope').id).toBe(KEEPERS[0].id);
    expect(keeperById(undefined).id).toBe(KEEPERS[0].id);
  });

  it('keeperFit is 0 with no traits, and its sign tracks the appeal fit', () => {
    expect(keeperFit(aether, undefined)).toBe(0);
    expect(keeperFit(aether, warmSocial)).toBeGreaterThan(0);
    expect(keeperFit(vanta, boldFiery)).toBeGreaterThan(0);
    expect(keeperFit(lumen, curiousMind)).toBeGreaterThan(0);
    expect(keeperFit(vanta, timidPrickly)).toBeLessThan(0);
  });

  it('keeperBonus is always an integer in [0, 2], 0 for no traits', () => {
    for (const k of KEEPERS) {
      expect(keeperBonus(k, undefined)).toBe(0);
      for (const t of [warmSocial, boldFiery, curiousMind, timidPrickly]) {
        const b = keeperBonus(k, t);
        expect(Number.isInteger(b)).toBe(true);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(2);
      }
    }
  });

  it('a strongly-fitting dino earns a bonus; a clashing one earns none (per-dino observability)', () => {
    expect(keeperBonus(aether, warmSocial)).toBeGreaterThan(0);
    expect(keeperBonus(vanta, boldFiery)).toBeGreaterThan(0);
    expect(keeperBonus(lumen, curiousMind)).toBeGreaterThan(0);
    // The same observer gives a clashing dino nothing — which observer you are matters per dino.
    expect(keeperBonus(vanta, timidPrickly)).toBe(0);
    expect(keeperBonus(aether, timidPrickly)).toBe(0);
  });
});
