import { describe, it, expect } from 'vitest';
import { COMP_RIG, charsUsed } from './pixelArt';

/** BACKLOG-610 — the youngster asleep: Pip curls in its own youth pose, not the adult's. */
describe('cycle 190-art — the compsognathus youth sleep pose', () => {
  const yd = COMP_RIG.youngDown!;
  const inked = (g: ReadonlyArray<string>) => g.join('').replace(/\./g, '').length;

  it('is two 20×20 breathing frames in the adult palette that actually differ', () => {
    expect(yd).toHaveLength(COMP_RIG.down!.length);
    for (const f of yd) {
      expect(f).toHaveLength(20);
      for (const row of f) expect(row).toHaveLength(20);
      for (const ch of charsUsed(f)) expect(Object.keys(COMP_RIG.palette(0xe0a23a))).toContain(ch);
    }
    expect(yd[1].join('')).not.toBe(yd[0].join(''));
  });

  it('reads as a child asleep: lid shut, smaller than the adult curl, close to the youth stand', () => {
    for (const f of yd) expect(f.join('')).not.toContain('e'); // the eye is shut
    expect(inked(yd[0])).toBeLessThan(inked(COMP_RIG.down![0]));
    const stand = inked(COMP_RIG.young![0]);
    expect(Math.abs(inked(yd[0]) - stand) / stand).toBeLessThan(0.25); // curling up does not make it bigger or vanish
  });
});
