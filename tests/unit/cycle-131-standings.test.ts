import { describe, expect, it } from 'vitest';
import {
  councilOf,
  providerOf,
  standingLine,
  standingLines,
  standingsOf,
  zoneStandings,
  type Standing,
} from '../../game/src/world/standings';
import { zoneCouncil, zoneProvider, type ProviderCandidate } from '../../game/src/ai/roles';
import { zoneChain } from '../../game/src/world/zones';

/**
 * One place the standings are derived (BACKLOG-482). The fold must agree with the modules it composes —
 * that agreement, not a new behavior, is the whole content of this item.
 */

const BOWL = zoneChain()[0];
const GROVE = zoneChain()[1];

const dino = (name: string, zoneId: string, foodBanked: number, provider = false): ProviderCandidate => ({
  name,
  zoneId,
  role: provider ? 'provider' : 'wanderer',
  foodBanked,
});

describe('zoneStandings', () => {
  it('a fresh park stands for nothing', () => {
    expect(zoneStandings([], {})).toEqual([]);
  });

  it('agrees exactly with the modules it composes, for every ground', () => {
    const roster = [
      dino('Rex', BOWL, 9, true),
      dino('Sunny', BOWL, 4),
      dino('Twitch', BOWL, 1),
      dino('Mossback', GROVE, 6, true),
    ];
    const all = zoneStandings(roster, { [GROVE]: 'Mossback' });
    for (const z of zoneChain()) {
      expect(providerOf(all, z)).toBe(zoneProvider(roster, z));
      expect(councilOf(all, z)).toEqual(zoneCouncil(roster, z));
    }
    // …and the composed answers are not vacuously empty.
    expect(providerOf(all, BOWL)).toBe('Rex');
    expect(councilOf(all, BOWL).length).toBeGreaterThan(0);
  });

  it('emits a pioneer for a ground nobody lives on, and nothing else', () => {
    const all = zoneStandings([], { [GROVE]: 'Twitch' });
    expect(all).toEqual([{ zone: GROVE, kind: 'pioneer', holders: ['Twitch'] }]);
  });

  it('orders each ground council → pioneer → provider, the book order', () => {
    const roster = [dino('Rex', GROVE, 9, true), dino('Sunny', GROVE, 4)];
    const kinds = zoneStandings(roster, { [GROVE]: 'Rex' })
      .filter((s) => s.zone === GROVE)
      .map((s) => s.kind);
    expect(kinds).toEqual(['council', 'pioneer', 'provider']);
  });
});

describe('standingsOf', () => {
  it('finds every standing a dino holds, across grounds', () => {
    const roster = [dino('Rex', BOWL, 9, true), dino('Sunny', BOWL, 4)];
    const all = zoneStandings(roster, { [GROVE]: 'Rex' }); // pioneer of one ground, seated on another
    const mine = standingsOf(all, 'Rex');
    expect(mine.map((s) => `${s.kind}@${s.zone}`).sort()).toEqual(
      [`council@${BOWL}`, `pioneer@${GROVE}`, `provider@${BOWL}`].sort(),
    );
    expect(standingsOf(all, 'Nobody')).toEqual([]);
  });
});

describe('standingLine', () => {
  const seat = (n: number): Standing => ({
    zone: GROVE,
    kind: 'council',
    holders: Array.from({ length: n }, (_, i) => `D${i}`),
  });

  it('says voice at one seat and voices above it', () => {
    expect(standingLine(seat(1))).toMatch(/1 voice$/);
    expect(standingLine(seat(2))).toMatch(/2 voices$/);
    expect(standingLine(seat(2))).toContain('👥');
  });

  it('gives the provider no book line — its book presence is the role, not a standing line', () => {
    expect(standingLine({ zone: BOWL, kind: 'provider', holders: ['Rex'] })).toBeNull();
  });

  it('prints the founding line for a pioneer', () => {
    expect(standingLine({ zone: GROVE, kind: 'pioneer', holders: ['Rex'] })).toContain('first across into');
  });
});

describe('standingLines', () => {
  it('renders a seated pioneer as seat then founding, and drops the provider', () => {
    const roster = [dino('Rex', GROVE, 9, true), dino('Sunny', GROVE, 4)];
    const lines = standingLines(zoneStandings(roster, { [GROVE]: 'Rex' }), 'Rex');
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('👥');
    expect(lines[1]).toContain('first across into');
  });

  it('is empty for a dino that holds nothing', () => {
    expect(standingLines(zoneStandings([dino('Sunny', BOWL, 0)], {}), 'Sunny')).toEqual([]);
  });
});
