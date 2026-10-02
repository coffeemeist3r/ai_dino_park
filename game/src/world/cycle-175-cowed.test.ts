import { describe, expect, it } from 'vitest';
import { cowedBy, cowedGobble, waitedLine, becauseOf, WAIT_ART_KEY } from './pecking';
import { gobblerAmong, slunkOffMemory } from './feeding';
import { worldPlacedProps } from './reachability';

const swarm = [
  { name: 'Rex', hunger: 0.95, agreeableness: 0.02 },
  { name: 'Glade', hunger: 0.9, agreeableness: 0.08 },
  { name: 'Sunny', hunger: 0.9, agreeableness: 0.62 },
];

describe('BACKLOG-397 cowedBy', () => {
  it('one slink-off from this winner is enough', () => {
    expect(cowedBy([slunkOffMemory('Mossback')], 'Mossback')).toBe(true);
  });
  it('no history, another winner, or a lone yield is not', () => {
    expect(cowedBy([], 'Mossback')).toBe(false);
    expect(cowedBy([slunkOffMemory('Glade')], 'Mossback')).toBe(false);
    expect(cowedBy(['you stepped back and let Mossback eat first'], 'Mossback')).toBe(false);
  });
});

describe('BACKLOG-397 cowedGobble', () => {
  it('with no history it is exactly gobblerAmong', () => {
    expect(cowedGobble('Mossback', 0.4, swarm, () => [])).toEqual({
      gobbler: gobblerAmong('Mossback', 0.4, swarm),
      waited: null,
    });
  });
  it('a cowed top gobbler waits and the next bully pushes in', () => {
    const mem = (n: string) => (n === 'Rex' ? [slunkOffMemory('Mossback')] : []);
    expect(cowedGobble('Mossback', 0.4, swarm, mem)).toEqual({ gobbler: 'Glade', waited: 'Rex' });
  });
  it('with no other bully, nobody pushes in', () => {
    const mem = () => [slunkOffMemory('Mossback')];
    expect(cowedGobble('Mossback', 0.4, swarm, mem)).toEqual({ gobbler: null, waited: 'Rex' });
  });
});

describe('BACKLOG-397 line and mark', () => {
  it('says why, in the hatch wording', () => {
    expect(waitedLine('Rex', 'Mossback')).toBe(`⏳ Rex waited its turn behind Mossback${becauseOf('wary', 'Mossback')}`);
  });
  it('the mark is placed by the world', () => {
    expect(worldPlacedProps().has(WAIT_ART_KEY)).toBe(true);
  });
});
