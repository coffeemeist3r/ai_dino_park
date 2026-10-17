import { describe, it, expect } from 'vitest';
import { COMP_RIG, charsUsed } from './pixelArt';

/** BACKLOG-608 — the youngster's own proportions (host 602): Pip is drawn as a child, not a shrunk adult. */
describe('cycle 189-art — the compsognathus youth pose', () => {
  const young = COMP_RIG.young!;
  const inked = (g: ReadonlyArray<string>) => g.join('').replace(/\./g, '').length;
  const rowsWith = (g: ReadonlyArray<string>, ch: string) => g.filter((r) => r.includes(ch)).length;

  it('is three 20×20 frames in the adult palette, and the steps actually move', () => {
    expect(young).toHaveLength(COMP_RIG.frames.length);
    for (const f of young) {
      expect(f).toHaveLength(20);
      for (const row of f) expect(row).toHaveLength(20);
      for (const ch of charsUsed(f)) expect(Object.keys(COMP_RIG.palette(0xe0a23a))).toContain(ch);
    }
    expect(young[1].join('')).not.toBe(young[0].join(''));
    expect(young[2].join('')).not.toBe(young[0].join(''));
  });

  it('reads as young: a bigger eye, shorter legs, and a head as wide as its body', () => {
    const [kid, adult] = [young[0], COMP_RIG.frames[0]];
    expect(kid.join('').split('e').length - 1).toBeGreaterThan(adult.join('').split('e').length - 1);
    expect(rowsWith(kid, 'd')).toBeLessThan(rowsWith(adult, 'd'));
    expect(kid[8].replace(/\./g, '').length).toBeGreaterThanOrEqual(kid[13].replace(/\./g, '').length - 1);
    expect(inked(kid)).toBeLessThan(inked(adult) * 1.25); // a child, not a heavier sprite
  });
});
