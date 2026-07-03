/**
 * Edge indicators (BACKLOG-398) — the pure adjacency-table read behind the zone-edge labels.
 * Pins the exact label per zone per linked edge, and that unlinked zones/edges label nothing.
 */
import { describe, expect, it } from 'vitest';
import { BOWL_ID, FERNREACH_ID, GROVE_ID, edgeIndicators } from '../../game/src/world/zones';

describe('edgeIndicators', () => {
  it('the bowl labels only its east edge, naming the grove', () => {
    expect(edgeIndicators(BOWL_ID)).toEqual([{ edge: 'east', text: 'The Grove ▸' }]);
  });

  it('the grove labels both edges — bowl west, Fernreach east', () => {
    expect(edgeIndicators(GROVE_ID)).toEqual([
      { edge: 'west', text: '◂ Pocket Cretaceous' },
      { edge: 'east', text: 'The Fernreach ▸' },
    ]);
  });

  it('the Fernreach labels only its west edge, naming the grove', () => {
    expect(edgeIndicators(FERNREACH_ID)).toEqual([{ edge: 'west', text: '◂ The Grove' }]);
  });

  it('an unknown zone labels nothing', () => {
    expect(edgeIndicators('the-void')).toEqual([]);
  });
});
