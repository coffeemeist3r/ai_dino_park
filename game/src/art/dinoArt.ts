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

/** Bake `count` evenly-spaced phases of a species pose into a walk-cycle frame list. */
export function walkFrames(baseColor: number, count: number): Shape[][] {
  return Array.from({ length: count }, (_, i) => triceratopsPose(baseColor, i / count));
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
