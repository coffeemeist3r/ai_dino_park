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

/** Pose function for one species' walk frame at a phase in [0,1). */
export type PoseFn = (baseColor: number, phase: number) => Shape[];

/**
 * The species the procedural pipeline can draw, each with a short anim-key prefix
 * and its pose rig. Species absent here fall back to a flat rectangle (see bake.ts).
 */
export const SPECIES_ART: Record<string, { prefix: string; pose: PoseFn }> = {
  triceratops: { prefix: 'tri', pose: triceratopsPose },
  brontosaurus: { prefix: 'bro', pose: brontosaurusPose },
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
