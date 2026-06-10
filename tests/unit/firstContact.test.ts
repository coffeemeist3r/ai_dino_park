import { describe, it, expect } from 'vitest';
import { INSPECT_TTL, inspector, inspectLine, inspectMemory } from '../../game/src/keeper/firstContact';
import { keeperById } from '../../game/src/keeper/keepers';
import type { Personality } from '../../game/src/ai/personality';

// The keepers.test.ts archetypes — maxed/minned on the appeal axes.
const boldFiery: Personality = { curiosity: 0.5, sociability: 0.3, energy: 0.9, agreeableness: 0.3, bravery: 0.95 };
const timidPrickly: Personality = { curiosity: 0.1, sociability: 0.2, energy: 0.15, agreeableness: 0.15, bravery: 0.05 };
const warmSocial: Personality = { curiosity: 0.5, sociability: 0.95, energy: 0.5, agreeableness: 0.95, bravery: 0.5 };

const vanta = keeperById('vanta');
const aether = keeperById('aether');

describe('first-contact inspection (BACKLOG-161)', () => {
  it('picks the strictly-best positive-fit dino for the new observer', () => {
    const cast = [
      { name: 'Mossback', traits: timidPrickly },
      { name: 'Twitch', traits: boldFiery },
    ];
    expect(inspector(vanta, cast)).toBe('Twitch');
    expect(inspector(aether, [{ name: 'Sunny', traits: warmSocial }, ...cast])).toBe('Sunny');
  });

  it('breaks an exact fit tie alphabetically', () => {
    const cast = [
      { name: 'Twitch', traits: boldFiery },
      { name: 'Glade', traits: boldFiery },
    ];
    expect(inspector(vanta, cast)).toBe('Glade');
  });

  it('returns null when nobody resonates (no positive fit)', () => {
    expect(inspector(vanta, [{ name: 'Mossback', traits: timidPrickly }])).toBeNull();
  });

  it('returns null for an empty cast', () => {
    expect(inspector(vanta, [])).toBeNull();
  });

  it('the beat line names the inspector + 👀; the memory names the keeper', () => {
    expect(inspectLine('Twitch')).toContain('Twitch');
    expect(inspectLine('Twitch')).toContain('👀');
    expect(inspectMemory(vanta.name)).toContain(vanta.name);
  });

  it('is deterministic, and the ttl covers a cross-bowl walk', () => {
    const cast = [{ name: 'Twitch', traits: boldFiery }];
    expect(inspector(vanta, cast)).toBe(inspector(vanta, cast));
    expect(inspectLine('Rex')).toBe(inspectLine('Rex'));
    // Worst-case Chebyshev walk on the 20×15 bowl is ~19 tiles at 1 tile/step.
    expect(INSPECT_TTL).toBeGreaterThanOrEqual(19);
  });
});
