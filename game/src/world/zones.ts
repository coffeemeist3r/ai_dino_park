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
export const FERNREACH_ID = 'fernreach'; // BACKLOG-378: the third zone, east of the grove (first non-bowl-adjacent)

export interface Zone {
  id: string;
  name: string;
}

export const ZONES: Zone[] = [
  { id: BOWL_ID, name: 'Pocket Cretaceous' },
  { id: GROVE_ID, name: 'The Grove' },
  { id: FERNREACH_ID, name: 'The Fernreach' },
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
  // BACKLOG-378: the third link — the grove's *east* edge opens onto the Fernreach (and back west). Appended
  // after the grove→bowl row so `linkEdge`/`otherZone` (first-match) keep the grove's primary neighbour = bowl.
  { from: GROVE_ID, edge: 'east', to: FERNREACH_ID },
  { from: FERNREACH_ID, edge: 'west', to: GROVE_ID },
];

/** The zone reached by leaving `zoneId` through `edge`, or null when that edge has no link. */
export function neighborThrough(zoneId: string, edge: Edge): string | null {
  return ZONE_LINKS.find((l) => l.from === zoneId && l.edge === edge)?.to ?? null;
}

/** Every link out of `zoneId` (a zone may now border more than one neighbour — BACKLOG-378). */
export function zoneNeighbors(zoneId: string): ZoneLink[] {
  return ZONE_LINKS.filter((l) => l.from === zoneId);
}

/**
 * The neighbour zone whose shared edge `tile` is currently sitting on (within `band` tiles of it), or null
 * when the dino is in the zone interior. Reads the adjacency table (383): a `west` link is met at the left
 * columns, an `east` link at the right columns. The gate for edge-meet barter (BACKLOG-358) — two dinos each
 * `nearLinkEdge`'d toward the *other's* zone are meeting at the boundary between them. First matching link
 * wins (a two-link zone like the grove reports whichever edge the tile is actually at).
 */
export function nearLinkEdge(zoneId: string, tile: { tileX: number }, cols: number, band = 1): string | null {
  for (const l of zoneNeighbors(zoneId)) {
    if (l.edge === 'west' && tile.tileX <= band) return l.to;
    if (l.edge === 'east' && tile.tileX >= cols - 1 - band) return l.to;
  }
  return null;
}

/**
 * The edge `zoneId` uses to reach its *primary* neighbour (its first outbound link), or null. With a third
 * zone the grove now has two links; this returns the first (grove→bowl, 'west') so the single-edge default
 * paths stay byte-identical — multi-neighbour callers pass the chosen edge explicitly (BACKLOG-378).
 */
export function linkEdge(zoneId: string): Edge | null {
  return ZONE_LINKS.find((l) => l.from === zoneId)?.edge ?? null;
}

/**
 * The neighbour reached by leaving `zoneId` through `edge`, plus the keeper's entry pixel on the far
 * side (one tile in from the opposite edge, vertical position preserved). null when that edge has no
 * link, so the caller clamps normally there. The entry x keys on the *exit edge*, not the zone id, so
 * it stays correct as the adjacency table grows.
 */
/**
 * Edge indicators (BACKLOG-398) — the label each linked edge of a zone shows so the neighbour is
 * legible *before* you walk into it. Reads the adjacency table: a fourth zone labels itself by
 * adding a ZONE_LINKS row, with zero UI changes. West links point left (◂ name), east links point
 * right (name ▸). Pure.
 */
export function edgeIndicators(zoneId: string): Array<{ edge: Edge; text: string }> {
  return zoneNeighbors(zoneId).map((l) => ({
    edge: l.edge,
    text: l.edge === 'west' ? `◂ ${zoneById(l.to).name}` : `${zoneById(l.to).name} ▸`,
  }));
}

/**
 * The zone chain west→east (BACKLOG-425) — the map lens's drawing order, read off the adjacency
 * table: start at the zone no east link points to (the westmost; today the bowl) and walk east
 * links. Any zone the walk never reaches is appended in ZONES order, so a future unlinked zone
 * still shows on the map instead of silently vanishing. Pure.
 */
export function zoneChain(): string[] {
  const eastTargets = new Set(ZONE_LINKS.filter((l) => l.edge === 'east').map((l) => l.to));
  const root = ZONES.find((z) => !eastTargets.has(z.id))?.id ?? ZONES[0].id;
  const chain: string[] = [];
  let cur: string | null = root;
  while (cur && !chain.includes(cur)) {
    chain.push(cur);
    cur = neighborThrough(cur, 'east');
  }
  for (const z of ZONES) if (!chain.includes(z.id)) chain.push(z.id);
  return chain;
}

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
export type TileKind = 'grass' | 'path' | 'water' | 'fern';
// 'fern' (BACKLOG-399) is the Fernreach's scrub kind; like the grove's path/water once did (294), it
// bakes as the grass fallback under the zone tint until the Artist draws its rig (FERN_RIG), so the floor
// is always whole and adding the kind can never break the build.

/** A cool, shaded multiplicative tint applied to the whole grove floor so it reads as woodland. */
export const GROVE_TINT = 0x9fc0b8;

/** A warm, sunlit tint for the Fernreach (BACKLOG-378) — the open fern flats read distinct from the cool grove. */
export const FERNREACH_TINT = 0xd9c98c;

/** The multiplicative floor tint for a zone (BACKLOG-294/378): grove cool, Fernreach warm, bowl untinted. */
export function zoneTint(zoneId: string): number {
  return zoneId === GROVE_ID ? GROVE_TINT : zoneId === FERNREACH_ID ? FERNREACH_TINT : 0xffffff;
}

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

/**
 * The Fernreach's ground (BACKLOG-399): the third zone reads as its own *place*, not tinted bowl grass.
 * Deliberately laid out unlike the grove (whose pond sits NE and whose trail runs the horizontal middle):
 * a **water creek** runs vertically down the west side, and **fern** scrub fills a southern band plus a
 * north-east thicket — so even before the fern rig exists, the creek (the already-drawn water rig) and the
 * warm FERNREACH_TINT make it distinct. Pure: (x,y) → tile kind over a cols×rows grid.
 */
export function fernreachTileAt(x: number, y: number, cols: number, rows: number): TileKind {
  // the creek: a 2-wide vertical run down the west side (vs the grove's NE pond).
  if (x >= 3 && x <= 4 && y >= 2 && y <= rows - 3) return 'water';
  // fern scrub: a southern band along the bottom, plus a north-east thicket.
  if (y >= rows - 2) return 'fern';
  if (x >= cols - 4 && y >= 1 && y <= 3) return 'fern';
  return 'grass';
}

/**
 * The terrain layout for a zone (BACKLOG-294/399): the grove and the Fernreach each have their own ground;
 * the bowl is plain grass (null → the caller bakes the untinted grass map). One dispatcher the floor render
 * reads, so a fourth zone is another arm here, not another edit to `drawFloor`.
 */
export function zoneTileAt(zoneId: string, x: number, y: number, cols: number, rows: number): TileKind | null {
  if (zoneId === GROVE_ID) return groveTileAt(x, y, cols, rows);
  if (zoneId === FERNREACH_ID) return fernreachTileAt(x, y, cols, rows);
  return null;
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

/**
 * The linked-edge tile in the current zone the migrant heads for (west edge → col 0, east edge → last col);
 * row preserved. `edge` defaults to the home zone's primary link, so single-neighbour callers are unchanged;
 * a migrant crossing to a *chosen* neighbour (the grove can now go west to the bowl OR east to the Fernreach,
 * BACKLOG-378) passes that crossing's edge explicitly.
 */
export function migrationStepTarget(
  homeZone: string,
  row: number,
  cols: number,
  edge: Edge | null = linkEdge(homeZone),
): { tileX: number; tileY: number } {
  return { tileX: edge === 'west' ? 0 : cols - 1, tileY: row };
}

/** Has the migrant reached its crossing edge (so the next step crosses)? `edge` defaults to the primary link. */
export function atMigrationEdge(
  homeZone: string,
  tile: { tileX: number },
  cols: number,
  edge: Edge | null = linkEdge(homeZone),
): boolean {
  return edge === 'west' ? tile.tileX <= 0 : tile.tileX >= cols - 1;
}

/**
 * The entry tile in the *destination* zone — one tile in from the opposite edge, row preserved — where the
 * migrant reappears on crossing (a west-crossing enters the destination's east side; an east-crossing enters
 * its west side), mirroring `linkedZone`'s keeper entries. `edge` defaults to the home zone's primary link.
 */
export function crossEntryTile(
  homeZone: string,
  row: number,
  cols: number,
  edge: Edge | null = linkEdge(homeZone),
): { tileX: number; tileY: number } {
  return { tileX: edge === 'west' ? cols - 2 : 1, tileY: row };
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
