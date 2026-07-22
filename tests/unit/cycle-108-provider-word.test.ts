import { describe, it, expect } from 'vitest';
import { zoneProvider, type ProviderCandidate } from '../../game/src/ai/roles';
import { cannedReply, providerAside, PRICKLY_MAX, EFFUSIVE_MIN } from '../../game/src/ai/brain';
import { providerWordLine, spreadProviderWord } from '../../game/src/world/providerword';
import { isShareable } from '../../game/src/social/gossip';
import { recall, type MemoryStore } from '../../game/src/ai/memory';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Word of the provider (BACKLOG-453) — the park's first economic standing (448) stops being a lens tag and
 * gets said out loud, in both registers the park already has: what a dino tells the keeper, and what a dino
 * tells another dino. Milestone 6's last lore arc.
 */

const traits = (agreeableness: number): Personality => ({
  bravery: 0.5,
  sociability: 0.5,
  curiosity: 0.5,
  energy: 0.5,
  agreeableness,
});

const PRICKLY = traits(PRICKLY_MAX - 0.1);
const EVEN = traits(0.5);
const WARM = traits(EFFUSIVE_MIN + 0.1);

const cand = (name: string, zoneId: string, foodBanked: number, role: ProviderCandidate['role'] = 'provider'): ProviderCandidate => ({
  name,
  zoneId,
  role,
  foodBanked,
});

describe('zoneProvider (BACKLOG-453)', () => {
  it('names the highest-tally provider living in the zone', () => {
    const all = [cand('Sunny', 'fernreach', 5), cand('Rex', 'fernreach', 2)];
    expect(zoneProvider(all, 'fernreach')).toBe('Sunny');
  });

  it('breaks a tie alphabetically, so a reload credits the same dino', () => {
    const all = [cand('Twitch', 'bowl', 3), cand('Glade', 'bowl', 3)];
    expect(zoneProvider(all, 'bowl')).toBe('Glade');
  });

  it('ignores a provider living in another zone', () => {
    const all = [cand('Sunny', 'grove', 9)];
    expect(zoneProvider(all, 'fernreach')).toBeNull();
  });

  it('ignores residents who have not settled the provider role', () => {
    const all = [cand('Rex', 'bowl', 9, 'wanderer'), cand('Mossback', 'bowl', 9, 'gossip')];
    expect(zoneProvider(all, 'bowl')).toBeNull();
  });

  it('an empty park has no provider anywhere', () => {
    expect(zoneProvider([], 'bowl')).toBeNull();
  });
});

describe('providerAside (BACKLOG-453) — same fact, three voices', () => {
  const asides = [
    providerAside('Sunny', 'The Fernreach', PRICKLY),
    providerAside('Sunny', 'The Fernreach', EVEN),
    providerAside('Sunny', 'The Fernreach', WARM),
  ];

  it('is a distinct line per temperament', () => {
    expect(new Set(asides).size).toBe(3);
  });

  it('names the same provider and zone in every voice — temperament colours the words, never the fact', () => {
    for (const a of asides) {
      expect(a).toContain('Sunny');
      expect(a).toContain('The Fernreach');
    }
  });

  it('leads with a space so it appends onto any register', () => {
    for (const a of asides) expect(a.startsWith(' ')).toBe(true);
  });

  it('never doubles the article on a zone that carries its own name', () => {
    for (const a of asides) expect(a).not.toContain('the The');
    expect(providerAside('Sunny', 'The Grove', WARM)).not.toContain('the The');
  });

  it('falls back to the plain voice with no traits', () => {
    expect(providerAside('Sunny', 'The Grove')).toBe(providerAside('Sunny', 'The Grove', EVEN));
  });
});

describe('cannedReply composition (BACKLOG-453)', () => {
  // The generic greeting branch is random, so every byte-identical assertion pins a deterministic
  // register — here the gratitude one.
  const base = { name: 'Rex', species: 'raptor', personality: 'p', traits: EVEN, gratitude: 'Twitch' };

  it('is byte-identical to today when there is no provider', () => {
    expect(cannedReply({ ...base }).text).toBe(cannedReply({ ...base, provider: undefined }).text);
  });

  it('appends the provider aside when there is one', () => {
    const text = cannedReply({ ...base, provider: { name: 'Sunny', zoneName: 'The Grove' } }).text;
    expect(text).toContain('Twitch'); // the gratitude register survives
    expect(text).toContain('Sunny');
    expect(text).toContain('The Grove');
  });

  it('composes after hunger and the chase, in that order, without truncating', () => {
    const text = cannedReply({
      ...base,
      gratitude: undefined,
      affection: 5,
      hungry: true,
      rattled: 'Twitch',
      provider: { name: 'Sunny', zoneName: 'The Grove' },
    }).text;
    const hunger = text.indexOf('could eat');
    const chase = text.indexOf('nearly had me');
    const provider = text.indexOf('eats because of Sunny');
    expect(hunger).toBeGreaterThan(-1);
    expect(chase).toBeGreaterThan(hunger);
    expect(provider).toBeGreaterThan(chase);
    expect(text).toContain('The Grove eats because of Sunny');
  });
});

describe('spreadProviderWord (BACKLOG-453)', () => {
  const store: MemoryStore = {};

  it('plants the word on the listener and returns it', () => {
    const { store: after, rumor } = spreadProviderWord(store, 'Rex', 'Mossback', 'Sunny', 'The Fernreach');
    expect(rumor).toBe(providerWordLine('Rex', 'Sunny', 'The Fernreach'));
    expect(recall(after, 'Mossback')).toContain(rumor);
  });

  it('plants a rumor that cannot re-spread — one hop, like every other word', () => {
    const { rumor } = spreadProviderWord(store, 'Rex', 'Mossback', 'Sunny', 'The Fernreach');
    expect(isShareable(rumor!)).toBe(false);
  });

  it('a provider never talks up its own pantry', () => {
    const out = spreadProviderWord(store, 'Sunny', 'Mossback', 'Sunny', 'The Fernreach');
    expect(out.rumor).toBeNull();
    expect(out.store).toBe(store);
  });

  it('says nothing when the zone has no provider', () => {
    const out = spreadProviderWord(store, 'Rex', 'Mossback', null, 'The Fernreach');
    expect(out.rumor).toBeNull();
    expect(out.store).toBe(store);
  });

  it('says nothing to itself', () => {
    const out = spreadProviderWord(store, 'Rex', 'Rex', 'Sunny', 'The Fernreach');
    expect(out.rumor).toBeNull();
    expect(out.store).toBe(store);
  });

  it('names the zone without doubling its article', () => {
    expect(providerWordLine('Rex', 'Sunny', 'The Grove')).not.toContain('the The');
  });
});
