/**
 * The Glass (BACKLOG-056) — the world is a sealed vivarium on a shelf; this draws
 * the bowl itself: a rounded glass rim, a darkened edge vignette, and a couple of
 * reflection streaks. Pure geometry (no Phaser): the scene draws what these
 * describe, and the numbers stay unit-testable.
 */

export const GLASS = {
  rim: 3, // crisp glass-edge line width
  edgeBand: 40, // how far the corner/edge shadow reaches inward
  rimColor: 0xbfeee2, // pale cyan glass edge
  innerColor: 0xffffff, // faint inner highlight
  vignetteColor: 0x06120e, // deep shadow hugging the glass
  vignetteAlpha: 0.34,
  glareColor: 0xffffff,
  glareAlpha: 0.1,
} as const;

/** Corner radius scales with the tile size. */
export function cornerRadius(tile: number): number {
  return Math.round(tile * 1.5);
}

/** The four inset rounded-rect strokes that form the rim, outermost first. */
export function rimRects(w: number, h: number): Array<{ x: number; y: number; width: number; height: number; inset: number }> {
  return [
    { x: 2, y: 2, width: w - 4, height: h - 4, inset: 2 },
    { x: 5, y: 5, width: w - 10, height: h - 10, inset: 5 },
  ];
}

/** Edge shadow bands (top, bottom, left, right) — overlap at the corners for a deeper bowl shadow. */
export function edgeBands(w: number, h: number, band = GLASS.edgeBand): Array<{ x: number; y: number; width: number; height: number }> {
  return [
    { x: 0, y: 0, width: w, height: band },
    { x: 0, y: h - band, width: w, height: band },
    { x: 0, y: 0, width: band, height: h },
    { x: w - band, y: 0, width: band, height: h },
  ];
}

/**
 * Reflection streaks across the glass, as flat [x0,y0,x1,y1,…] polygons from the
 * top-left (where light would catch a curved surface).
 */
export function glarePolys(w: number, h: number): number[][] {
  return [
    [0, h * 0.1, w * 0.34, 0, w * 0.46, 0, 0, h * 0.34],
    [0, h * 0.52, w * 0.16, 0, w * 0.22, 0, 0, h * 0.66],
  ];
}

/** Convert a flat polygon to {x,y} points for Phaser's fillPoints. */
export function toPoints(flat: number[]): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] });
  return pts;
}
