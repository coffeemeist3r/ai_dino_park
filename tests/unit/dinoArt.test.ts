import { describe, it, expect } from 'vitest';
import { shade, triceratopsPose, brontosaurusPose, parasaurolophusPose, compsognathusPose, stegosaurusPose, walkFrames, paletteOf, SPECIES_ART } from '../../game/src/art/dinoArt';

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

describe('parasaurolophusPose', () => {
  const pose = parasaurolophusPose(0x5a8ab0, 0);

  it('renders a hadrosaur rig: barrel + belly + head + duck-bill + four feet, two eyes, crest + tail polys', () => {
    const ellipses = pose.filter((s) => s.kind === 'ellipse');
    const circles = pose.filter((s) => s.kind === 'circle');
    const polys = pose.filter((s) => s.kind === 'poly');
    expect(ellipses.length).toBeGreaterThanOrEqual(6); // 4 feet + body + belly + head + bill
    expect(circles).toHaveLength(2); // eyes
    expect(polys.length).toBeGreaterThanOrEqual(2); // tube crest + tail
  });

  it('keeps a disciplined, limited palette', () => {
    expect(paletteOf(pose).length).toBeLessThanOrEqual(8);
  });

  it('animates — opposite stride frames differ in foot position', () => {
    const frames = walkFrames(0x5a8ab0, 4, parasaurolophusPose);
    const footY = (frame: typeof frames[number]) =>
      frame.filter((s) => s.kind === 'ellipse').map((s) => s.y);
    expect(footY(frames[1])).not.toEqual(footY(frames[3]));
  });
});

describe('compsognathusPose', () => {
  const pose = compsognathusPose(0xc0683a, 0);

  it('renders a biped rig: body + belly + back + head + snout + two feet, two eyes, tail + shins + forelimbs + neck polys', () => {
    const ellipses = pose.filter((s) => s.kind === 'ellipse');
    const circles = pose.filter((s) => s.kind === 'circle');
    const polys = pose.filter((s) => s.kind === 'poly');
    expect(ellipses.length).toBeGreaterThanOrEqual(6); // 2 feet + body + belly + back + head + snout
    expect(circles).toHaveLength(2); // eyes
    expect(polys.length).toBeGreaterThanOrEqual(4); // tail + two shins + forelimbs + neck
  });

  it('stands on exactly two feet — the cast’s only biped', () => {
    // feet are the leg-coloured foot ellipses near the bottom of the box (y > 0.85)
    const feet = pose.filter((s) => s.kind === 'ellipse' && (s.y ?? 0) > 0.85);
    expect(feet).toHaveLength(2);
  });

  it('keeps a disciplined, limited palette', () => {
    expect(paletteOf(pose).length).toBeLessThanOrEqual(8);
  });

  it('animates — opposite stride frames differ in foot position', () => {
    const frames = walkFrames(0xc0683a, 4, compsognathusPose);
    const footY = (frame: typeof frames[number]) =>
      frame.filter((s) => s.kind === 'ellipse').map((s) => s.y);
    expect(footY(frames[1])).not.toEqual(footY(frames[3]));
  });
});

describe('stegosaurusPose', () => {
  const pose = stegosaurusPose(0x4a7a4a, 0);

  it('renders a stegosaur rig: barrel + belly + head + snout + four feet, two eyes, tail + thagomizer + plate polys', () => {
    const ellipses = pose.filter((s) => s.kind === 'ellipse');
    const circles = pose.filter((s) => s.kind === 'circle');
    const polys = pose.filter((s) => s.kind === 'poly');
    expect(ellipses.length).toBeGreaterThanOrEqual(6); // 4 feet + body + belly + head + snout
    expect(circles).toHaveLength(2); // eyes
    expect(polys.length).toBeGreaterThanOrEqual(6); // tail + 2 thagomizer spikes + ≥4 dorsal plates
  });

  it('wears its signature double row of dorsal plates (≥4 kite polys up the spine)', () => {
    const plates = pose.filter((s) => s.kind === 'poly' && (s.points?.length ?? 0) === 4);
    expect(plates.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps a disciplined, limited palette', () => {
    expect(paletteOf(pose).length).toBeLessThanOrEqual(8);
  });

  it('animates — opposite stride frames differ in foot position', () => {
    const frames = walkFrames(0x4a7a4a, 4, stegosaurusPose);
    const footY = (frame: typeof frames[number]) =>
      frame.filter((s) => s.kind === 'ellipse').map((s) => s.y);
    expect(footY(frames[1])).not.toEqual(footY(frames[3]));
  });
});

describe('SPECIES_ART registry', () => {
  it('registers all five cast species with distinct anim-key prefixes', () => {
    expect(Object.keys(SPECIES_ART)).toEqual(
      expect.arrayContaining(['triceratops', 'brontosaurus', 'parasaurolophus', 'compsognathus', 'stegosaurus']),
    );
    expect(SPECIES_ART.triceratops.prefix).toBe('tri'); // pinned: cycle-030 e2e expects /^tri_walk_/
    expect(SPECIES_ART.compsognathus.prefix).toBe('comp');
    expect(SPECIES_ART.stegosaurus.prefix).toBe('steg');
    const prefixes = Object.values(SPECIES_ART).map((a) => a.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length); // all prefixes distinct
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
