/**
 * Connected zones (BACKLOG-143) — the bigger-world spine. The park is no longer a single bowl: a
 * keeper can walk off a designated edge into an adjacent zone and back. This is the foundation the
 * map arc and the benched path/water tile art (BACKLOG-033) wait on.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene drives `crossing`/`linkedZone` off the
 * keeper's pixel position at move time and repositions on a cross. Spine only — the grove starts
 * empty of dinos; per-dino occupancy/migration is BACKLOG-274 (the occupancy API below ships now so
 * "which zone is X in" is already answerable and tested).
 */

export const BOWL_ID = 'bowl';
export const GROVE_ID = 'grove';

export interface Zone {
  id: string;
  name: string;
}

export const ZONES: Zone[] = [
  { id: BOWL_ID, name: 'Pocket Cretaceous' },
  { id: GROVE_ID, name: 'The Grove' },
];

/** The zone for an id, falling back to the bowl for an unknown id. */
export function zoneById(id: string): Zone {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

/** The edges that can link to another zone. This spine wires only east↔west (bowl east ↔ grove west). */
export type Edge = 'east' | 'west';

/**
 * Which linked edge a keeper pixel-x has stepped past, or null while still inside. Computed on the
 * raw (pre-clamp) position: the keeper is normally clamped to [tile/2, cols*tile - tile/2], so a step
 * beyond either side means a crossing. Vertical edges are not linked this spine.
 */
export function crossing(px: number, cols: number, tile: number): Edge | null {
  if (px > cols * tile - tile / 2) return 'east';
  if (px < tile / 2) return 'west';
  return null;
}

/**
 * The neighbour reached by leaving `zoneId` through `edge`, plus the keeper's entry pixel on the far
 * side (one tile in from the opposite edge, vertical position preserved). null when that edge has no
 * link, so the caller clamps normally there.
 */
export function linkedZone(
  zoneId: string,
  edge: Edge,
  py: number,
  cols: number,
  tile: number,
): { zoneId: string; entry: { x: number; y: number } } | null {
  if (zoneId === BOWL_ID && edge === 'east') {
    return { zoneId: GROVE_ID, entry: { x: tile * 1.5, y: py } };
  }
  if (zoneId === GROVE_ID && edge === 'west') {
    return { zoneId: BOWL_ID, entry: { x: cols * tile - tile * 1.5, y: py } };
  }
  return null;
}

/**
 * Grove terrain (BACKLOG-294) — the second zone reads as its own *place*, not cloned bowl grass.
 * Pure layout only: which sub-region each grove tile belongs to. The pixel rigs for path/water are the
 * Artist's (BACKLOG-033); until they exist those tiles bake as grass under GROVE_TINT, so the floor is
 * always whole and the tint alone already makes the grove distinct.
 */
export type TileKind = 'grass' | 'path' | 'water';

/** A cool, shaded multiplicative tint applied to the whole grove floor so it reads as woodland. */
export const GROVE_TINT = 0x9fc0b8;

/**
 * The grove's ground: a worn horizontal **path** band across the vertical middle (the trail through the
 * clearing) and a small **water** pond in the north-east corner; everything else grass. Pure: (x,y) →
 * tile kind, in tile coordinates over a cols×rows grid.
 */
export function groveTileAt(x: number, y: number, cols: number, rows: number): TileKind {
  const midY = Math.floor(rows / 2);
  // NE pond: a 4×3 block one tile in from the top-right.
  if (x >= cols - 5 && x <= cols - 2 && y >= 2 && y <= 4) return 'water';
  // the trail: the two middle rows, full width.
  if (y === midY || y === midY - 1) return 'path';
  return 'grass';
}

/** Per-entity occupancy over a plain map (BACKLOG-143 API; populated by BACKLOG-274). */
export function setZone(map: Record<string, string>, id: string, zoneId: string): void {
  map[id] = zoneId;
}

export function zoneOf(map: Record<string, string>, id: string, fallback: string): string {
  return map[id] ?? fallback;
}

/** The other zone of the bowl↔grove pair (BACKLOG-274 migration). Any non-grove id maps to the bowl. */
export function otherZone(id: string): string {
  return id === GROVE_ID ? BOWL_ID : GROVE_ID;
}

/**
 * The distinct zones that currently have residents (BACKLOG-314) — the home zone of every named dino,
 * deduped. The resource roll spawns one slot per occupied zone, so each inhabited zone grows its own
 * gathering economy instead of only the keeper's. Pure.
 */
export function occupiedZones(map: Record<string, string>, fallback: string, names: string[]): string[] {
  return [...new Set(names.map((n) => zoneOf(map, n, fallback)))];
}
