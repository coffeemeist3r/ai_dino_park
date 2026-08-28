/**
 * Edge indicators (BACKLOG-398) — the pure adjacency-table read behind the zone-edge labels.
 * Pins the exact label per zone per linked edge, and that unlinked zones/edges label nothing.
 */
import { describe, expect, it } from 'vitest';
import { BOWL_ID, FERNREACH_ID,
  HOLLOW_ID, GROVE_ID, SALTPAN_ID, edgeIndicators } from '../../game/src/world/zones';

describe('edgeIndicators', () => {
  it('the bowl labels only its east edge, naming the grove', () => {
    expect(edgeIndicators(BOWL_ID)).toEqual([{ edge: 'east', text: 'The Grove ▸' }]);
  });

  it('the grove labels both edges — bowl west, Fernreach east', () => {
    expect(edgeIndicators(GROVE_ID)).toEqual([
      { edge: 'west', text: '◂ Pocket Cretaceous' },
      { edge: 'east', text: 'The Fernreach ▸' },
      // BACKLOG-478: three edges now, and the first vertical label the park has ever drawn.
      { edge: 'north', text: '▴ The Sunward Ridge' },
    ]);
  });

  it('the Fernreach labels only its west edge, naming the grove', () => {
    // BACKLOG-472: the Fernreach labels both edges now; the Hollow is the one-edge end of the chain.
    expect(edgeIndicators(FERNREACH_ID)).toEqual([
      { edge: 'west', text: '◂ The Grove' },
      { edge: 'east', text: 'The Hollow ▸' },
    ]);
    // BACKLOG-505: the Hollow stopped being the end of the chain, so the one-edge end moved to the Saltpan.
    expect(edgeIndicators(HOLLOW_ID)).toEqual([
      { edge: 'west', text: '◂ The Fernreach' },
      { edge: 'east', text: 'The Saltpan ▸' },
    ]);
    expect(edgeIndicators(SALTPAN_ID)).toEqual([{ edge: 'west', text: '◂ The Hollow' }]);
  });

  it('an unknown zone labels nothing', () => {
    expect(edgeIndicators('the-void')).toEqual([]);
  });
});
