/**
 * Procedural vector art for dinosaurs — "art as code", the artifact a per-character
 * Artist sub-agent authors (see STYLE-GUIDE.md). Pure data, no Phaser: a dino is a
 * list of flat vector shapes in a normalized 0..1 box (0,0 top-left; feet near y=1,
 * head toward the camera near y=0). Because it's pure, every walk frame is poseable
 * and Node-testable, and the same rig animates by re-posing rather than re-drawing.
 *
 * The Phaser side (art/bake.ts) is the only place that turns these shapes into a
 * texture — the "convert to procedural Canvas for animation" step.
 */

export interface Shape {
  kind: 'ellipse' | 'circle' | 'poly';
  fill: number; // 0xRRGGBB
  stroke?: number; // optional outline colour
  // ellipse / circle: centre + radii, all in 0..1 of the sprite box
  x?: number;
  y?: number;
  rx?: number;
  ry?: number;
  r?: number;
  // poly: vertices in 0..1
  points?: Array<[number, number]>;
}

/** Lighten (amt>0) or darken (amt<0) a packed RGB colour toward white/black. */
export function shade(color: number, amt: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (c: number) => {
    const target = amt >= 0 ? 255 : 0;
    const v = Math.round(c + (target - c) * Math.abs(amt));
    return Math.max(0, Math.min(255, v));
  };
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}

const BONE = 0xf3e7c8; // horns + beak
const EYE = 0x241a14;

/**
 * A triceratops seen 3/4 top-down, facing the camera, posed for a walk `phase`
 * in [0,1). The four feet swing in diagonal pairs and the body bobs, so a handful
 * of phases bake into a believable amble loop.
 */
export function triceratopsPose(baseColor: number, phase: number): Shape[] {
  const belly = shade(baseColor, 0.22);
  const frill = shade(baseColor, 0.1);
  const leg = shade(baseColor, -0.2);
  const outline = shade(baseColor, -0.5);

  const t = phase * Math.PI * 2;
  const swing = Math.sin(t) * 0.035; // diagonal leg pairs swing opposite
  const bob = Math.abs(Math.sin(t)) * 0.02; // body lifts on the stride

  const foot = (x: number, y: number, dir: number): Shape => ({
    kind: 'ellipse',
    fill: leg,
    stroke: outline,
    x,
    y: y + dir * swing,
    rx: 0.07,
    ry: 0.09,
  });

  return [
    // feet first so the body overlaps them — diagonal pairs (FL+BR), (FR+BL)
    foot(0.3, 0.78, +1),
    foot(0.66, 0.92, +1),
    foot(0.7, 0.78, -1),
    foot(0.34, 0.92, -1),

    // neck frill fanned behind the head
    { kind: 'ellipse', fill: frill, stroke: outline, x: 0.5, y: 0.34 - bob, rx: 0.3, ry: 0.2 },

    // body
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.62 - bob, rx: 0.3, ry: 0.26 },
    { kind: 'ellipse', fill: belly, x: 0.5, y: 0.66 - bob, rx: 0.19, ry: 0.15 },

    // head
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.3 - bob, rx: 0.17, ry: 0.15 },

    // brow horns + nose beak (bone)
    { kind: 'poly', fill: BONE, stroke: outline, points: [[0.4, 0.22], [0.46, 0.23], [0.39, 0.07]] },
    { kind: 'poly', fill: BONE, stroke: outline, points: [[0.6, 0.22], [0.54, 0.23], [0.61, 0.07]] },
    { kind: 'poly', fill: BONE, stroke: outline, points: [[0.45, 0.2], [0.55, 0.2], [0.5, 0.1]] },

    // eyes
    { kind: 'circle', fill: EYE, x: 0.43, y: 0.3 - bob, r: 0.028 },
    { kind: 'circle', fill: EYE, x: 0.57, y: 0.3 - bob, r: 0.028 },
  ];
}

/**
 * A brontosaurus seen in the same 3/4 top-down framing as the triceratops — feet
 * near y=1, head toward the camera near y=0. The silhouette is all sauropod: a
 * long neck rising up the box to a tiny head, a fat barrel body, and a thick tail
 * curling off behind. Same diagonal-pair foot swing + body bob drive the amble.
 */
export function brontosaurusPose(baseColor: number, phase: number): Shape[] {
  const belly = shade(baseColor, 0.22);
  const leg = shade(baseColor, -0.2);
  const outline = shade(baseColor, -0.5);

  const t = phase * Math.PI * 2;
  const swing = Math.sin(t) * 0.035;
  const bob = Math.abs(Math.sin(t)) * 0.02;

  const foot = (x: number, y: number, dir: number): Shape => ({
    kind: 'ellipse',
    fill: leg,
    stroke: outline,
    x,
    y: y + dir * swing,
    rx: 0.07,
    ry: 0.09,
  });

  return [
    // feet first — diagonal pairs, same scheme as the triceratops
    foot(0.32, 0.8, +1),
    foot(0.64, 0.92, +1),
    foot(0.68, 0.8, -1),
    foot(0.36, 0.92, -1),

    // thick tail curling off behind the body (drawn first so the barrel overlaps its root)
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.66, 0.64], [0.97, 0.86], [0.74, 0.75]] },

    // the long neck rising toward the camera — the whole point of the silhouette
    { kind: 'poly', fill: baseColor, stroke: outline, points: [[0.42, 0.58 - bob], [0.58, 0.58 - bob], [0.54, 0.19 - bob], [0.46, 0.19 - bob]] },

    // fat barrel body + belly highlight
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.64 - bob, rx: 0.31, ry: 0.24 },
    { kind: 'ellipse', fill: belly, x: 0.5, y: 0.68 - bob, rx: 0.2, ry: 0.14 },

    // small head + a gentle snout
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.15 - bob, rx: 0.11, ry: 0.09 },
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.1 - bob, rx: 0.06, ry: 0.05 },

    // eyes
    { kind: 'circle', fill: EYE, x: 0.45, y: 0.14 - bob, r: 0.022 },
    { kind: 'circle', fill: EYE, x: 0.55, y: 0.14 - bob, r: 0.022 },
  ];
}

/**
 * A parasaurolophus seen in the same 3/4 top-down framing — feet near y=1, head
 * toward the camera near y=0. The silhouette signature is the long tube crest
 * sweeping up-and-back off the head (kept to one side for the 3/4 turn) over a
 * broad duck-bill snout. Same diagonal-pair foot swing + body bob as the others.
 */
export function parasaurolophusPose(baseColor: number, phase: number): Shape[] {
  const belly = shade(baseColor, 0.22);
  const crest = shade(baseColor, 0.12);
  const leg = shade(baseColor, -0.2);
  const outline = shade(baseColor, -0.5);

  const t = phase * Math.PI * 2;
  const swing = Math.sin(t) * 0.035;
  const bob = Math.abs(Math.sin(t)) * 0.02;

  const foot = (x: number, y: number, dir: number): Shape => ({
    kind: 'ellipse',
    fill: leg,
    stroke: outline,
    x,
    y: y + dir * swing,
    rx: 0.07,
    ry: 0.09,
  });

  return [
    // feet first — diagonal pairs, same scheme as the others
    foot(0.3, 0.78, +1),
    foot(0.66, 0.92, +1),
    foot(0.7, 0.78, -1),
    foot(0.34, 0.92, -1),

    // short tail off behind the barrel (drawn before the body so the barrel overlaps its root)
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.66, 0.62], [0.92, 0.8], [0.72, 0.72]] },

    // the tube crest — the signature — sweeping up and back off the head to one side
    { kind: 'poly', fill: crest, stroke: outline, points: [[0.5, 0.26 - bob], [0.58, 0.24 - bob], [0.72, 0.05 - bob], [0.63, 0.04 - bob]] },

    // barrel body + belly highlight
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.62 - bob, rx: 0.3, ry: 0.25 },
    { kind: 'ellipse', fill: belly, x: 0.5, y: 0.66 - bob, rx: 0.19, ry: 0.14 },

    // head + broad duck-bill snout
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.22 - bob, rx: 0.13, ry: 0.12 },
    { kind: 'ellipse', fill: belly, stroke: outline, x: 0.5, y: 0.1 - bob, rx: 0.13, ry: 0.06 },

    // eyes
    { kind: 'circle', fill: EYE, x: 0.44, y: 0.22 - bob, r: 0.026 },
    { kind: 'circle', fill: EYE, x: 0.56, y: 0.22 - bob, r: 0.026 },
  ];
}

/**
 * A compsognathus seen in the same 3/4 top-down framing — but the cast's only
 * biped, which is the whole silhouette. It stands on two striding legs under a
 * slim, upright (taller-than-wide) body, a long thin neck rising to a small alert
 * head with two big watchful eyes, tiny grasping forelimbs, and a long tail
 * counter-balancing off behind. The two feet alternate fore/aft (not diagonal
 * pairs) for a quick, jittery sprinter's gait — "quick to bolt".
 */
export function compsognathusPose(baseColor: number, phase: number): Shape[] {
  const belly = shade(baseColor, 0.22);
  const leg = shade(baseColor, -0.2);
  const outline = shade(baseColor, -0.5);
  const back = shade(baseColor, -0.32); // dorsal stripe — its watchful two-tone marking

  const t = phase * Math.PI * 2;
  const swing = Math.sin(t) * 0.05; // a longer stride than the lumbering quadrupeds
  const bob = Math.abs(Math.sin(t)) * 0.025;

  const foot = (x: number, y: number, dir: number): Shape => ({
    kind: 'ellipse',
    fill: leg,
    stroke: outline,
    x,
    y: y + dir * swing,
    rx: 0.06,
    ry: 0.07,
  });

  return [
    // long tail sweeping low off behind (drawn first so the body overlaps its root)
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.52, 0.66 - bob], [0.96, 0.82], [0.87, 0.9], [0.5, 0.74 - bob]] },

    // two striding shins (biped) — alternate fore/aft with the foot swing
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.4, 0.6 - bob], [0.47, 0.6 - bob], [0.45, 0.93 + swing], [0.38, 0.93 + swing]] },
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.53, 0.6 - bob], [0.6, 0.6 - bob], [0.62, 0.93 - swing], [0.55, 0.93 - swing]] },
    foot(0.41, 0.94, +1),
    foot(0.58, 0.94, -1),

    // slim, upright body (taller than wide) + belly highlight
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.55 - bob, rx: 0.16, ry: 0.22 },
    { kind: 'ellipse', fill: belly, x: 0.5, y: 0.6 - bob, rx: 0.1, ry: 0.14 },
    // dorsal stripe along the upper back
    { kind: 'ellipse', fill: back, x: 0.5, y: 0.45 - bob, rx: 0.12, ry: 0.1 },

    // tiny grasping forelimb nubs
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.42, 0.5 - bob], [0.46, 0.52 - bob], [0.37, 0.58 - bob]] },
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.58, 0.5 - bob], [0.54, 0.52 - bob], [0.63, 0.58 - bob]] },

    // long slim neck rising to the small head
    { kind: 'poly', fill: baseColor, stroke: outline, points: [[0.45, 0.42 - bob], [0.55, 0.42 - bob], [0.54, 0.2 - bob], [0.46, 0.2 - bob]] },

    // small alert head + a pointed snout
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.16 - bob, rx: 0.09, ry: 0.08 },
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.09 - bob, rx: 0.045, ry: 0.035 },

    // two big watchful eyes
    { kind: 'circle', fill: EYE, x: 0.46, y: 0.15 - bob, r: 0.026 },
    { kind: 'circle', fill: EYE, x: 0.54, y: 0.15 - bob, r: 0.026 },
  ];
}

/**
 * A stegosaurus seen in the same 3/4 top-down framing — feet near y=1, head toward
 * the camera near y=0. The whole silhouette is two things: the **staggered double row
 * of kite-shaped dorsal plates** marching up the spine, and the **thagomizer** — the
 * cluster of bone tail-spikes off the back. The head is tiny and set low (a stego tell).
 * Same diagonal-pair foot swing + body bob as the other quadrupeds drive the amble.
 *
 * (First draft used plain triangles in a single centred row — it read as a frill, not
 * plates; reworked to staggered kites in two columns so the double-row silhouette pops.)
 */
export function stegosaurusPose(baseColor: number, phase: number): Shape[] {
  const belly = shade(baseColor, 0.22);
  const plate = shade(baseColor, 0.12);
  const leg = shade(baseColor, -0.2);
  const outline = shade(baseColor, -0.5);

  const t = phase * Math.PI * 2;
  const swing = Math.sin(t) * 0.035;
  const bob = Math.abs(Math.sin(t)) * 0.02;

  const foot = (x: number, y: number, dir: number): Shape => ({
    kind: 'ellipse',
    fill: leg,
    stroke: outline,
    x,
    y: y + dir * swing,
    rx: 0.07,
    ry: 0.09,
  });

  // a kite-shaped dorsal plate centred at (cx,cy): tall point up, short point down.
  const kite = (cx: number, cy: number, w: number, h: number): Shape => ({
    kind: 'poly',
    fill: plate,
    stroke: outline,
    points: [
      [cx, cy - h],
      [cx + w, cy],
      [cx, cy + h * 0.45],
      [cx - w, cy],
    ],
  });

  return [
    // feet first — diagonal pairs, same scheme as the other quadrupeds
    foot(0.3, 0.8, +1),
    foot(0.66, 0.92, +1),
    foot(0.7, 0.8, -1),
    foot(0.34, 0.92, -1),

    // thick tail off behind, tipped with the thagomizer bone spikes
    { kind: 'poly', fill: leg, stroke: outline, points: [[0.64, 0.64], [0.93, 0.84], [0.7, 0.74]] },
    { kind: 'poly', fill: BONE, stroke: outline, points: [[0.89, 0.83], [0.99, 0.79], [0.92, 0.88]] },
    { kind: 'poly', fill: BONE, stroke: outline, points: [[0.87, 0.88], [0.97, 0.9], [0.89, 0.93]] },

    // low, broad barrel body + belly highlight
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.64 - bob, rx: 0.3, ry: 0.24 },
    { kind: 'ellipse', fill: belly, x: 0.5, y: 0.68 - bob, rx: 0.19, ry: 0.14 },

    // the signature — a staggered double row of dorsal plates up the spine
    kite(0.45, 0.5 - bob, 0.06, 0.12),
    kite(0.56, 0.46 - bob, 0.06, 0.13),
    kite(0.46, 0.62 - bob, 0.07, 0.13),
    kite(0.57, 0.6 - bob, 0.06, 0.12),

    // small head + short snout, set low at the front (tiny-headed stegosaur)
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.28 - bob, rx: 0.1, ry: 0.09 },
    { kind: 'ellipse', fill: baseColor, stroke: outline, x: 0.5, y: 0.2 - bob, rx: 0.055, ry: 0.045 },

    // eyes
    { kind: 'circle', fill: EYE, x: 0.46, y: 0.28 - bob, r: 0.024 },
    { kind: 'circle', fill: EYE, x: 0.54, y: 0.28 - bob, r: 0.024 },
  ];
}

/** Pose function for one species' walk frame at a phase in [0,1). */
export type PoseFn = (baseColor: number, phase: number) => Shape[];

/**
 * The species the procedural pipeline can draw, each with a short anim-key prefix
 * and its pose rig. Species absent here fall back to a flat rectangle (see bake.ts).
 */
export const SPECIES_ART: Record<string, { prefix: string; pose: PoseFn }> = {
  triceratops: { prefix: 'tri', pose: triceratopsPose },
  brontosaurus: { prefix: 'bro', pose: brontosaurusPose },
  parasaurolophus: { prefix: 'para', pose: parasaurolophusPose },
  compsognathus: { prefix: 'comp', pose: compsognathusPose },
  stegosaurus: { prefix: 'steg', pose: stegosaurusPose },
};

/** Bake `count` evenly-spaced phases of a species pose into a walk-cycle frame list. */
export function walkFrames(baseColor: number, count: number, pose: PoseFn = triceratopsPose): Shape[][] {
  return Array.from({ length: count }, (_, i) => pose(baseColor, i / count));
}

/** Every distinct colour a pose uses — for palette-discipline checks. */
export function paletteOf(shapes: Shape[]): number[] {
  const seen = new Set<number>();
  for (const s of shapes) {
    seen.add(s.fill);
    if (s.stroke !== undefined) seen.add(s.stroke);
  }
  return [...seen];
}
