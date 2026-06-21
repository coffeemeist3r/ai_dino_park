import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

describe('resource + cairn pixel props (BACKLOG-296)', () => {
  it('draws branch, stone, and cairn', () => {
    expect(Object.keys(PROP_RIGS).sort()).toEqual(['branch', 'cairn', 'stone']);
  });

  for (const [name, rig] of Object.entries(PROP_RIGS)) {
    describe(name, () => {
      it('is a square grid of `size` rows, each `size` chars wide', () => {
        expect(rig.grid.length).toBe(rig.size);
        for (const row of rig.grid) expect(row.length).toBe(rig.size);
      });

      it('every non-transparent char has a palette color, ≤ 8 colors (GBA discipline)', () => {
        const used = propCharsUsed(rig.grid);
        for (const ch of used) expect(rig.palette[ch]).toBeTypeOf('number');
        expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
      });

      it('is non-empty (actually draws something)', () => {
        expect(propCharsUsed(rig.grid).size).toBeGreaterThan(0);
      });

      it('has a dark outline char `o`', () => {
        expect(rig.palette.o).toBeTypeOf('number');
        expect(propCharsUsed(rig.grid).has('o')).toBe(true);
      });
    });
  }

  it('the three props are visually distinct (different pixel grids)', () => {
    const join = (n: string) => PROP_RIGS[n].grid.join('\n');
    expect(join('branch')).not.toBe(join('stone'));
    expect(join('stone')).not.toBe(join('cairn'));
    expect(join('branch')).not.toBe(join('cairn'));
  });
});
