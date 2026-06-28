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
 * Zone adjacency (BACKLOG-383) — the bowl↔grove link was hard-coded into linkedZone / otherZone / the
 * three migration helpers (five places, all encoding bowl-east↔grove-west). This table is the single
 * source of truth for which zones connect through which edge, so a third zone (BACKLOG-378) slots in by
 * adding a row, not by editing every helper. The helpers below all read it; behavior is byte-identical
 * while only this one pair exists.
 */
export interface ZoneLink {
  from: string;
  edge: Edge;
  to: string;
}

export const ZONE_LINKS: ZoneLink[] = [
  { from: BOWL_ID, edge: 'east', to: GROVE_ID },
  { from: GROVE_ID, edge: 'west', to: BOWL_ID },
];

/** The zone reached by leaving `zoneId` through `edge`, or null when that edge has no link. */
export function neighborThrough(zoneId: string, edge: Edge): string | null {
  return ZONE_LINKS.find((l) => l.from === zoneId && l.edge === edge)?.to ?? null;
}

/** The edge `zoneId` uses to reach its linked neighbour (its single outbound link this spine), or null. */
export function linkEdge(zoneId: string): Edge | null {
  return ZONE_LINKS.find((l) => l.from === zoneId)?.edge ?? null;
}

/**
 * The neighbour reached by leaving `zoneId` through `edge`, plus the keeper's entry pixel on the far
 * side (one tile in from the opposite edge, vertical position preserved). null when that edge has no
 * link, so the caller clamps normally there. The entry x keys on the *exit edge*, not the zone id, so
 * it stays correct as the adjacency table grows.
 */
export function linkedZone(
  zoneId: string,
  edge: Edge,
  py: number,
  cols: number,
  tile: number,
): { zoneId: string; entry: { x: number; y: number } } | null {
  const to = neighborThrough(zoneId, edge);
  if (!to) return null;
  const x = edge === 'east' ? tile * 1.5 : cols * tile - tile * 1.5;
  return { zoneId: to, entry: { x, y: py } };
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

/**
 * The linked neighbour a migrant heads to (BACKLOG-274 migration), now read off the adjacency table
 * (BACKLOG-383). For the bowl↔grove pair this is each zone's single neighbour; an unknown id keeps the
 * old default (→ grove) so behavior is unchanged.
 */
export function otherZone(id: string): string {
  return ZONE_LINKS.find((l) => l.from === id)?.to ?? (id === GROVE_ID ? BOWL_ID : GROVE_ID);
}

/**
 * Visible zone crossing (BACKLOG-334) — a migrating dino walks to its zone's linked edge and crosses,
 * instead of `relocate`-teleporting to a random far-zone tile. The bowl links east, the grove links west
 * (the same bowl-east↔grove-west pairing the keeper crosses on). Pure tile math, keyed on the dino's
 * *current* (origin) zone; only the bowl↔grove pair exists this spine.
 */

/** The linked-edge tile in the current zone the migrant heads for (bowl → east col, grove → west col); row preserved. */
export function migrationStepTarget(homeZone: string, row: number, cols: number): { tileX: number; tileY: number } {
  return { tileX: linkEdge(homeZone) === 'west' ? 0 : cols - 1, tileY: row };
}

/** Has the migrant reached its linked edge (so the next step crosses)? */
export function atMigrationEdge(homeZone: string, tile: { tileX: number }, cols: number): boolean {
  return linkEdge(homeZone) === 'west' ? tile.tileX <= 0 : tile.tileX >= cols - 1;
}

/**
 * The entry tile in the *destination* zone — one tile in from the opposite edge, row preserved — where the
 * migrant reappears on crossing (bowl→grove enters the grove's west edge; grove→bowl enters the bowl's east
 * edge), mirroring `linkedZone`'s keeper entries.
 */
export function crossEntryTile(homeZone: string, row: number, cols: number): { tileX: number; tileY: number } {
  return { tileX: linkEdge(homeZone) === 'west' ? cols - 2 : 1, tileY: row };
}

/**
 * The distinct zones that currently have residents (BACKLOG-314) — the home zone of every named dino,
 * deduped. The resource roll spawns one slot per occupied zone, so each inhabited zone grows its own
 * gathering economy instead of only the keeper's. Pure.
 */
export function occupiedZones(map: Record<string, string>, fallback: string, names: string[]): string[] {
  return [...new Set(names.map((n) => zoneOf(map, n, fallback)))];
}

/**
 * Per-zone head count (BACKLOG-316) — how many named dinos call each zone home, so the split world is
 * legible from the plaque without walking it. The counting twin of `occupiedZones`: every `ZONES` id is
 * present (seeded 0), names map by home zone (unmapped → fallback). Pure.
 */
export function zonePopulations(map: Record<string, string>, names: string[], fallback: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const z of ZONES) counts[z.id] = 0;
  for (const n of names) {
    const id = zoneOf(map, n, fallback);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
