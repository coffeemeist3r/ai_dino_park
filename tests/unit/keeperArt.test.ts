import { describe, it, expect } from 'vitest';
import { AKI_RIG, KEEPER_RIGS, type KeeperRig } from '../../game/src/art/keeperArt';
import { charsUsed } from '../../game/src/art/pixelArt';

const rigs: KeeperRig[] = Object.values(KEEPER_RIGS);

describe('keeper rigs (BACKLOG-158)', () => {
  it('the default observer AETHER-1 is drawn', () => {
    expect(KEEPER_RIGS.aether).toBe(AKI_RIG);
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
