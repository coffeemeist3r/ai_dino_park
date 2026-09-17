import { describe, it, expect } from 'vitest';
import { AKI_RIG, VIX_RIG, LUX_RIG, KES_RIG, KEEPER_RIGS, type KeeperRig } from '../../game/src/art/keeperArt';
import { KEEPERS } from '../../game/src/keeper/keepers';
import { charsUsed } from '../../game/src/art/pixelArt';

const rigs: KeeperRig[] = Object.values(KEEPER_RIGS);

describe('keeper rigs (BACKLOG-158)', () => {
  it('the default observer AETHER-1 is drawn', () => {
    expect(KEEPER_RIGS.aether).toBe(AKI_RIG);
  });

  it('VANTA-9 is drawn (cycle 046-art)', () => {
    expect(KEEPER_RIGS.vanta).toBe(VIX_RIG);
  });

  it('LUMEN-3 is drawn, and the whole roster renders pixel again (cycle 163-art)', () => {
    expect(KEEPER_RIGS.lumen).toBe(LUX_RIG);
    // Narrowed to the three robots for the length of cycle 163's morning, when BACKLOG-212 added a fourth
    // seat that shipped undrawn on the amber square. **Restored the same night, as its note promised.**
    // This is the assertion that stops a watcher shipping as a rectangle unnoticed, so it is roster-wide
    // again rather than a list of ids somebody has to remember to extend.
    for (const k of KEEPERS) expect(KEEPER_RIGS[k.id]).toBeDefined();
  });

  it('Kes reads as a creature, not a chassis (BACKLOG-554)', () => {
    const head = KES_RIG.frames[0].slice(0, 7);
    // The three robots all wear a horizontal optic — a band, a slit, a lens. Kes wears two round eyes.
    expect([...head.join('')].filter((ch) => ch === 'y')).toHaveLength(2);
    // A crest that breaks the top edge and a beak that breaks the bottom one: the silhouette, not the colour,
    // is what has to say "not a machine" at 16px.
    expect(head[0]).toContain('c');
    expect([...head[0]].filter((ch) => ch === 'c')).toHaveLength(3);
    expect(head[head.length - 1]).toContain('k');
    // Three-toed talons rather than the robots' blunt pads — on every frame, including mid-stride.
    for (const frame of KES_RIG.frames) expect(frame[19]).toContain('k');
  });

  it('shares no plumage tone with any chassis — the roster has no metal in this one', () => {
    const metal = new Set([
      ...Object.values(AKI_RIG.palette),
      ...Object.values(VIX_RIG.palette),
      ...Object.values(LUX_RIG.palette),
    ]);
    for (const tone of [KES_RIG.palette.f, KES_RIG.palette.h, KES_RIG.palette.d, KES_RIG.palette.o]) {
      expect(metal.has(tone)).toBe(false);
    }
  });

  it('the rectangle-fallback control stands on a genuine no-art id (the pterodactyl convention)', () => {
    expect(KEEPER_RIGS['vex-0']).toBeUndefined();
  });

  describe('Lux reads as the cataloguer — one great round eye', () => {
    it('the lens fills the head: glass on four consecutive head rows, widest mid-circle', () => {
      const head = LUX_RIG.frames[0].slice(0, 10);
      const lensRows = head.filter((row) => row.includes('l'));
      expect(lensRows.length).toBeGreaterThanOrEqual(4);
      const width = (row: string) => row.replace(/\./g, '').length;
      expect(width(head[5])).toBeGreaterThan(width(head[2])); // circle taper, not a band
    });

    it('carries the core glow, the lamp, and a single sparkle pixel', () => {
      const flat = LUX_RIG.frames[0].join('');
      expect(LUX_RIG.frames[0][0]).toContain('g'); // the lamp on its stem
      expect([...flat].filter((ch) => ch === 'w')).toHaveLength(1); // one sparkle, upper-left
    });

    it('shares no chassis tone with Aki or Vix (ivory vs brass vs gunmetal)', () => {
      const others = new Set([...Object.values(AKI_RIG.palette), ...Object.values(VIX_RIG.palette)]);
      for (const tone of [LUX_RIG.palette.b, LUX_RIG.palette.d]) {
        expect(others.has(tone)).toBe(false);
      }
    });
  });

  describe('Vix reads as the scout, not a recolored Aki', () => {
    const coverage = (rig: KeeperRig) =>
      Math.max(...rig.frames[0].map((row) => row.replace(/\./g, '').length));

    it('wears the hostile red optic slit on a single head row', () => {
      const headRows = VIX_RIG.frames[0].slice(0, 6);
      const redRows = headRows.filter((row) => row.includes('r'));
      expect(redRows).toHaveLength(1); // a slit, not Aki's two-row visor
      expect(VIX_RIG.palette.r).toBe(0xe03c4c);
    });

    it('is leaner than Aki — narrower widest row', () => {
      expect(coverage(VIX_RIG)).toBeLessThan(coverage(AKI_RIG));
    });

    it('carries the twin sensor fins on the crown', () => {
      expect([...VIX_RIG.frames[0][0]].filter((ch) => ch === 'f')).toHaveLength(2);
    });

    it('shares no chassis tone with Aki (gunmetal vs brass)', () => {
      const aki = new Set(Object.values(AKI_RIG.palette));
      for (const tone of [VIX_RIG.palette.c, VIX_RIG.palette.h, VIX_RIG.palette.s]) {
        expect(aki.has(tone)).toBe(false);
      }
    });
  });

  for (const rig of rigs) {
    describe(rig.id, () => {
      it('every frame is exactly width×height (16×20)', () => {
        expect(rig.width).toBe(16);
        expect(rig.height).toBe(20);
        for (const frame of rig.frames) {
          expect(frame).toHaveLength(rig.height);
          for (const row of frame) expect(row).toHaveLength(rig.width);
        }
      });

      it('keeps GBA palette discipline (≤ 15 colors + transparency, all used chars mapped)', () => {
        const colors = Object.keys(rig.palette);
        expect(colors.length).toBeLessThanOrEqual(15);
        for (const frame of rig.frames) {
          for (const ch of charsUsed(frame)) expect(rig.palette[ch]).toBeDefined();
        }
      });

      it('carries a dark outline on the silhouette', () => {
        for (const frame of rig.frames) expect(charsUsed(frame).has('o')).toBe(true);
      });

      it('the three frames actually differ (stand / step-L / step-R)', () => {
        const [stand, l, r] = rig.frames.map((f) => f.join('\n'));
        expect(stand).not.toBe(l);
        expect(stand).not.toBe(r);
        expect(l).not.toBe(r);
      });

      it('only the legs move — the body (rows 0–15) is identical across frames', () => {
        const body = (f: ReadonlyArray<string>) => f.slice(0, 16).join('\n');
        const bodies = rig.frames.map(body);
        expect(bodies.every((b) => b === bodies[0])).toBe(true);
      });

      it('the amble sequence indexes real frames', () => {
        expect(rig.sequence.length).toBeGreaterThan(0);
        for (const i of rig.sequence) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(rig.frames.length);
        }
      });
    });
  }
});
