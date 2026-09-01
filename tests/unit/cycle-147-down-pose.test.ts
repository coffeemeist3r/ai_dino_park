import { describe, it, expect } from 'vitest';
import { PIXEL_SPECIES, REX_RIG, MOSS_RIG, charsUsed } from '../../game/src/art/pixelArt';

const DRAWN = [
  ['triceratops', REX_RIG],
  ['stegosaurus', MOSS_RIG],
] as const;

/** Which rows a frame actually paints — the silhouette's vertical extent. */
function paintedRows(frame: ReadonlyArray<string>): number[] {
  return frame.map((r, i) => (/[^.]/.test(r) ? i : -1)).filter((i) => i >= 0);
}

describe('the sleeping pose (BACKLOG-522)', () => {
  for (const [species, rig] of DRAWN) {
    describe(species, () => {
      it('is a full square grid, same size as the walk frames', () => {
        for (const frame of rig.down!) {
          expect(frame).toHaveLength(rig.size);
          for (const row of frame) expect(row).toHaveLength(rig.size);
        }
      });

      it('paints only chars its own palette resolves — no new colours smuggled in asleep', () => {
        const pal = rig.palette(0x8a4a3a);
        for (const frame of rig.down!) {
          for (const ch of charsUsed(frame)) expect(pal[ch], `char '${ch}'`).toBeTypeOf('number');
        }
      });

      it('breathes: two frames, and they differ', () => {
        expect(rig.down).toHaveLength(2);
        expect(rig.down![0]).not.toEqual(rig.down![1]);
      });

      it('drops its head without floating off the ground', () => {
        // Two halves of one claim, and both matter. The animal is LOWER — its topmost painted row sits
        // below the standing frame's, which is what makes it read as lying down. And it still meets the
        // SAME ground line, because a sprite whose feet leave the tile it is standing on is a bug the
        // rest of the park has no way to see.
        const rows = (f: ReadonlyArray<string>) => paintedRows(f);
        expect(Math.min(...rows(rig.down![0]))).toBeGreaterThan(Math.min(...rows(rig.frames[0])));
        expect(Math.max(...rows(rig.down![0]))).toBe(Math.max(...rows(rig.frames[0])));
      });

      it('keeps the silhouette — as many painted pixels as the standing frame, give or take', () => {
        // The read this pose exists for: still recognisably the same animal. A pose that lost a third of
        // its mass would be a blob with the right palette.
        const mass = (f: ReadonlyArray<string>) => f.join('').replace(/\./g, '').length;
        const stand = mass(rig.frames[0]);
        const down = mass(rig.down![0]);
        expect(down).toBeGreaterThan(stand * 0.75);
      });
    });
  }

  it('leaves three species undrawn — the graceful fallback stays exercised', () => {
    const undrawn = Object.entries(PIXEL_SPECIES).filter(([, r]) => !r.down?.length);
    expect(undrawn.length).toBeGreaterThan(0);
    // A species with no down pose must still be a complete, renderable walk rig.
    for (const [, r] of undrawn) expect(r.frames.length).toBeGreaterThan(0);
  });
});
