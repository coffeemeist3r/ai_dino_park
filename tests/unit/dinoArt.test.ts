import { describe, it, expect } from 'vitest';
import { shade, triceratopsPose, brontosaurusPose, walkFrames, paletteOf, SPECIES_ART } from '../../game/src/art/dinoArt';

describe('shade', () => {
  it('lightens toward white and darkens toward black, clamped', () => {
    expect(shade(0x808080, 0)).toBe(0x808080);
    expect(shade(0x000000, 1)).toBe(0xffffff);
    expect(shade(0xffffff, -1)).toBe(0x000000);
    // a partial lighten of grey moves each channel up but stays in range
    const lighter = shade(0x404040, 0.5);
    expect(lighter).toBeGreaterThan(0x404040);
    expect(lighter).toBeLessThanOrEqual(0xffffff);
  });
});

describe('triceratopsPose', () => {
  const pose = triceratopsPose(0x8a4a3a, 0);

  it('renders a recognisable rig: body, head, frill, four feet, two eyes, horns', () => {
    const ellipses = pose.filter((s) => s.kind === 'ellipse');
    const circles = pose.filter((s) => s.kind === 'circle');
    const polys = pose.filter((s) => s.kind === 'poly');
    expect(ellipses.length).toBeGreaterThanOrEqual(6); // 4 feet + body + frill + head
    expect(circles).toHaveLength(2); // eyes
    expect(polys.length).toBeGreaterThanOrEqual(3); // two brow horns + nose
  });

  it('every shape carries a valid 24-bit fill colour', () => {
    for (const s of pose) {
      expect(s.fill).toBeGreaterThanOrEqual(0);
      expect(s.fill).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('keeps a disciplined, limited palette', () => {
    expect(paletteOf(pose).length).toBeLessThanOrEqual(8);
  });
});

describe('brontosaurusPose', () => {
  const pose = brontosaurusPose(0xd8b84a, 0);

  it('renders a sauropod rig: barrel + belly + head + snout + four feet, two eyes, neck + tail polys', () => {
    const ellipses = pose.filter((s) => s.kind === 'ellipse');
    const circles = pose.filter((s) => s.kind === 'circle');
    const polys = pose.filter((s) => s.kind === 'poly');
    expect(ellipses.length).toBeGreaterThanOrEqual(6); // 4 feet + body + belly + head + snout
    expect(circles).toHaveLength(2); // eyes
    expect(polys.length).toBeGreaterThanOrEqual(2); // long neck + thick tail
  });

  it('keeps a disciplined, limited palette', () => {
    expect(paletteOf(pose).length).toBeLessThanOrEqual(8);
  });

  it('animates — opposite stride frames differ in foot position', () => {
    const frames = walkFrames(0xd8b84a, 4, brontosaurusPose);
    const footY = (frame: typeof frames[number]) =>
      frame.filter((s) => s.kind === 'ellipse').map((s) => s.y);
    expect(footY(frames[1])).not.toEqual(footY(frames[3]));
  });
});

describe('SPECIES_ART registry', () => {
  it('registers triceratops and brontosaurus with distinct anim-key prefixes', () => {
    expect(Object.keys(SPECIES_ART)).toEqual(expect.arrayContaining(['triceratops', 'brontosaurus']));
    expect(SPECIES_ART.triceratops.prefix).toBe('tri'); // pinned: cycle-030 e2e expects /^tri_walk_/
    expect(SPECIES_ART.brontosaurus.prefix).not.toBe(SPECIES_ART.triceratops.prefix);
  });
});

describe('walkFrames', () => {
  it('produces the requested number of frames', () => {
    expect(walkFrames(0x8a4a3a, 4)).toHaveLength(4);
  });

  it('actually animates — opposite stride frames differ in foot position', () => {
    const frames = walkFrames(0x8a4a3a, 4);
    const footY = (frame: typeof frames[number]) => frame.filter((s) => s.kind === 'ellipse').map((s) => s.y);
    // frame 1 (phase .25) and frame 3 (phase .75) are the stride extremes
    expect(footY(frames[1])).not.toEqual(footY(frames[3]));
  });

  it('defaults to the triceratops pose and is deterministic for a given colour', () => {
    expect(walkFrames(0x5a8ab0, 4)).toEqual(walkFrames(0x5a8ab0, 4));
    expect(walkFrames(0x5a8ab0, 4)).toEqual(walkFrames(0x5a8ab0, 4, triceratopsPose));
  });
});
