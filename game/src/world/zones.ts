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
/**
 * BACKLOG-472: the fourth zone, east of the Fernreach — the cold, damp end of the chain. 449 folded
 * terrain into a table and promised "a fourth zone is a row, not three branches"; this is that cheque
 * being cashed. Everything the Hollow needs is data in this file plus one crop row (plot.ts) and one
 * season row (cropseason.ts) — no cross-zone system was edited to make room for it.
 */
export const HOLLOW_ID = 'hollow';
/**
 * BACKLOG-478: the fifth ground, and the first that is not further along a line. Four zones and every link
 * between them was east/west, so `ZONE_LINKS` has been called an adjacency *graph* while only ever encoding
 * a path — `zoneChain` walks it as a list, and 475's breadth-first `hopDistances` has never had a branch to
 * find. The Ridge hangs off the *middle* of the chain (north out of the Grove), so the Grove has three
 * neighbours, `hopToward` finally has a genuine choice to make, and "the nearest ground that qualifies" stops
 * being a synonym for "the next one east".
 */
export const RIDGE_ID = 'ridge';

export interface Zone {
  id: string;
  name: string;
}

export const ZONES: Zone[] = [
  { id: BOWL_ID, name: 'Pocket Cretaceous' },
  { id: GROVE_ID, name: 'The Grove' },
  { id: FERNREACH_ID, name: 'The Fernreach' },
  { id: HOLLOW_ID, name: 'The Hollow' }, // BACKLOG-472
  { id: RIDGE_ID, name: 'The Sunward Ridge' }, // BACKLOG-478 — the branch, not the next link in the line
];

/** The zone for an id, falling back to the bowl for an unknown id. */
export function zoneById(id: string): Zone {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

/**
 * The edges that can link to another zone. East↔west was the whole of it for four grounds (BACKLOG-143);
 * BACKLOG-478 adds the vertical pair, because a fifth ground appended to the east end would have been a
 * longer line, not a fork — the Grove's east and west edges were already spoken for, and its north one
 * was not.
 */
export type Edge = 'east' | 'west' | 'north' | 'south';

/**
 * Which linked edge a keeper pixel position has stepped past, or null while still inside. Computed on the
 * raw (pre-clamp) position: the keeper is normally clamped to [tile/2, cols*tile - tile/2] on x and the
 * same on y, so a step beyond any side means a crossing. Both axes since BACKLOG-478.
 */
export function crossing(px: number, py: number, cols: number, rows: number, tile: number): Edge | null {
  if (px > cols * tile - tile / 2) return 'east';
  if (px < tile / 2) return 'west';
  if (py > rows * tile - tile / 2) return 'south';
  if (py < tile / 2) return 'north';
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
  // BACKLOG-472: the fourth link — the Fernreach's *east* edge opens onto the Hollow (and back west).
  // Appended after the fernreach→grove row so `linkEdge`/`otherZone` (first-match) keep the Fernreach's
  // primary neighbour = grove, exactly as 378 did for the grove.
  { from: FERNREACH_ID, edge: 'east', to: HOLLOW_ID },
  { from: HOLLOW_ID, edge: 'west', to: FERNREACH_ID },
  // BACKLOG-478: the fork. Appended *after* the grove's west and east rows so `linkEdge`/`otherZone`
  // (first-match) still answer 'west'/bowl for the grove — the discipline 378 and 472 both used, and the
  // reason every pre-478 single-neighbour default path is byte-identical on a branching map.
  { from: GROVE_ID, edge: 'north', to: RIDGE_ID },
  { from: RIDGE_ID, edge: 'south', to: GROVE_ID },
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
export function nearLinkEdge(
  zoneId: string,
  tile: { tileX: number; tileY: number },
  cols: number,
  rows: number,
  band = 1,
): string | null {
  for (const l of zoneNeighbors(zoneId)) {
    if (l.edge === 'west' && tile.tileX <= band) return l.to;
    if (l.edge === 'east' && tile.tileX >= cols - 1 - band) return l.to;
    if (l.edge === 'north' && tile.tileY <= band) return l.to; // BACKLOG-478
    if (l.edge === 'south' && tile.tileY >= rows - 1 - band) return l.to;
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
const EDGE_LABEL: Record<Edge, (name: string) => string> = {
  west: (n) => `◂ ${n}`,
  east: (n) => `${n} ▸`,
  north: (n) => `▴ ${n}`, // BACKLOG-478
  south: (n) => `${n} ▾`,
};

export function edgeIndicators(zoneId: string): Array<{ edge: Edge; text: string }> {
  return zoneNeighbors(zoneId).map((l) => ({
    edge: l.edge,
    text: EDGE_LABEL[l.edge](zoneById(l.to).name),
  }));
}

/**
 * The zone chain (BACKLOG-425) — the map lens's drawing order and the park's iteration order: start at the
 * zone no east link points to (the westmost; today the bowl), walk east links, then append in ZONES order
 * every zone the walk never reached.
 *
 * **This is an iteration order, never a distance and never a direction** (BACKLOG-478). It was written when
 * the park was a line, where "next in the chain" and "one hop east" happened to coincide; with the Ridge
 * hanging north off the Grove they no longer do, and the append-the-unreached fallback — added in 425 as a
 * safety net for a hypothetical unlinked zone — is now what puts a genuine *branch* on the lens. A caller
 * that wants how far or which way asks `hopsBetween` / `hopToward` (distance.ts) and reads the link's edge;
 * `griefEdge` used to derive direction from the indices here, and 478 had to fix it. Pure.
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
  px: number,
  py: number,
  cols: number,
  rows: number,
  tile: number,
): { zoneId: string; entry: { x: number; y: number } } | null {
  const to = neighborThrough(zoneId, edge);
  if (!to) return null;
  // BACKLOG-478: a vertical crossing preserves the *column* and enters from the far side's top/bottom,
  // exactly as a horizontal one preserves the row. The entry keys on the exit edge, not the zone id.
  if (edge === 'north') return { zoneId: to, entry: { x: px, y: rows * tile - tile * 1.5 } };
  if (edge === 'south') return { zoneId: to, entry: { x: px, y: tile * 1.5 } };
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

/** A cold slate-blue wash for the Hollow (BACKLOG-472) — the damp sink at the cold end of the chain,
 *  distinct from the grove's cool green and the Fernreach's warm sand. */
export const HOLLOW_TINT = 0x8fa8c8;

/** The untinted floor — the bowl, and any zone that doesn't ask for a wash. */
export const NO_TINT = 0xffffff;

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

/** The centre of the grove's NE pond block (BACKLOG-436) — the tile a thirsty grove dino leans toward.
 *  Kept in sync with the water block in `groveTileAt` (x∈[cols-5,cols-2], y∈[2,4]); pure. */
export function grovePondTile(cols: number): { tileX: number; tileY: number } {
  return { tileX: cols - 3, tileY: 3 };
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
 * The bowl's ground (BACKLOG-445): for 104 cycles the starting zone was the one place with no terrain at
 * all — plain grass, and so the one place a thirsty dino had nowhere to drink. It gets a small **waterhole**
 * in the north-west; everything else stays grass, so the bowl still reads as the open bowl it always was.
 *
 * The block is deliberately sited clear of everything the bowl already fixes in place: the huddle tile
 * (10,11), the plot (2,12), the food-landing row (`foodLanding` → y=6 at 15 rows), and the east migration
 * edge (x=cols-1). Pure: (x,y) → tile kind.
 */
export function bowlTileAt(x: number, y: number, _cols: number, _rows: number): TileKind {
  // NW waterhole: a 3×2 block two tiles in from the top-left.
  if (x >= 2 && x <= 4 && y >= 2 && y <= 3) return 'water';
  return 'grass';
}

/** The centre of the bowl's NW waterhole (BACKLOG-445) — the bowl's twin of `grovePondTile`. Kept in sync
 *  with the water block in `bowlTileAt` (x∈[2,4], y∈[2,3]); pure. */
export function bowlPondTile(): { tileX: number; tileY: number } {
  return { tileX: 3, tileY: 2 };
}

/** A point on the Fernreach's west creek (BACKLOG-445) — the creek has been drawn since 399 and nothing
 *  ever drank from it. Kept in sync with the water run in `fernreachTileAt` (x∈[3,4], y∈[2,rows-3]); pure. */
export function fernreachCreekTile(rows: number): { tileX: number; tileY: number } {
  return { tileX: 3, tileY: Math.floor(rows / 2) };
}

/**
 * The Hollow's ground (BACKLOG-472): the fourth zone, laid out unlike the other three on purpose — the
 * bowl's waterhole sits NW, the grove's pond NE with a mid trail, the Fernreach's creek runs the west
 * side. The Hollow is a sink: a **fen rim** of scrub across the north and a **standing pool** in the
 * centre-south, no trail at all. The rim reuses the `fern` kind (399), which bakes as grass under the
 * tint until its rig exists — the same seam that has kept the floor whole through three terrain additions.
 * Pure: (x,y) → tile kind over a cols×rows grid.
 */
export function hollowTileAt(x: number, y: number, _cols: number, rows: number): TileKind {
  // the standing pool: a 5×2 block in the centre-south (vs the bowl's NW, the grove's NE, the creek's west).
  if (x >= 7 && x <= 11 && y >= rows - 5 && y <= rows - 4) return 'water';
  // the fen rim: a scrub band across the north, one tile in from the top.
  if (y >= 1 && y <= 2) return 'fern';
  return 'grass';
}

/** The centre of the Hollow's standing pool (BACKLOG-472) — pinned to the water block in `hollowTileAt`
 *  by the cycle-108 landmark invariant, not by a comment. */
export function hollowPoolTile(rows: number): { tileX: number; tileY: number } {
  return { tileX: 9, tileY: rows - 5 };
}

/**
 * The Sunward Ridge's ground (BACKLOG-478), laid out unlike the other four on purpose — the bowl's waterhole
 * sits NW, the grove's pond NE with a horizontal mid trail, the Fernreach's creek runs the west side, the
 * Hollow is a fen rim over a centre-south pool. The Ridge is climbed, not crossed: a **switchback trail runs
 * vertically** down the two middle columns (the grove's trail rotated a quarter turn, which is the whole
 * point of a ground you enter from the south), with a small **tarn** in the south-west where the meltwater
 * collects. No scrub. Pure: (x,y) → tile kind over a cols×rows grid.
 */
export function ridgeTileAt(x: number, y: number, cols: number, rows: number): TileKind {
  // the tarn: a 3×2 block in the south-west (vs the bowl's NW, the grove's NE, the Hollow's centre-south).
  if (x >= 2 && x <= 4 && y >= rows - 4 && y <= rows - 3) return 'water';
  // the switchback: the two middle columns, full height.
  const midX = Math.floor(cols / 2);
  if (x === midX || x === midX - 1) return 'path';
  return 'grass';
}

/** The centre of the Ridge's south-west tarn (BACKLOG-478) — pinned to `ridgeTileAt`'s water block by the
 *  cycle-108 terrain-table invariant. */
export function ridgeTarnTile(rows: number): { tileX: number; tileY: number } {
  return { tileX: 3, tileY: rows - 4 };
}

/** A high, sun-bleached warm wash for the Ridge (BACKLOG-478) — brighter than the Fernreach's sand, and the
 *  only tint in the park that reads as *above* the others. */
export const RIDGE_TINT = 0xf0d2b4;

/**
 * A zone's ground, as data (BACKLOG-449). Terrain used to be three hand-written layout functions reached
 * through an `if` chain, with two more `if` chains beside it — one for the named water landmark, one for
 * the floor tint. Three branch points for what is really *one fact per zone*, so a fourth zone meant an
 * edit in three places and every terrain-reading feature had to special-case zone ids.
 *
 * This is the `ZONE_LINKS` treatment (383) applied to ground: one descriptor per zone hanging off the
 * ZONES table, and the dispatchers below become lookups. A fourth zone is a row.
 *
 * The per-zone functions above stay exported and unchanged — they're the descriptors' rules now, not
 * dispatcher arms, so the tests and `arrival.ts` that import them directly need no edit.
 */
export interface ZoneTerrain {
  /** (x,y) → tile kind over a cols×rows grid. Pure. */
  tileAt: (x: number, y: number, cols: number, rows: number) => TileKind;
  /** Multiplicative floor tint (NO_TINT = untinted). */
  tint: number;
  /**
   * The tile a thirsty resident walks to, or absent for a waterless zone. Pinned to `tileAt` by the
   * table-driven invariant in `cycle-108-terrain-table.test.ts` — the landmark used to be kept honest by
   * a "kept in sync with" comment on each helper, which is not a mechanism.
   */
  water?: (cols: number, rows: number) => { tileX: number; tileY: number };
}

/** Each zone's ground. The landmark helpers take different argument subsets, so they're wrapped here
 *  rather than edited — three exported functions with four importers each are not worth the churn. */
export const ZONE_TERRAIN: Record<string, ZoneTerrain> = {
  [BOWL_ID]: { tileAt: bowlTileAt, tint: NO_TINT, water: () => bowlPondTile() },
  [GROVE_ID]: { tileAt: groveTileAt, tint: GROVE_TINT, water: (cols) => grovePondTile(cols) },
  [FERNREACH_ID]: { tileAt: fernreachTileAt, tint: FERNREACH_TINT, water: (_cols, rows) => fernreachCreekTile(rows) },
  // BACKLOG-472: the fourth ground, added as the row 449 said it would be. Note what is *not* here: no
  // ZONE_BIAS entry (resource.ts) and no structure kind — the Hollow falls through those two documented
  // back-compat seams (uniform branch/stone gathering, the default cairn). A fourth resource kind drags in
  // recipes, barter, craft escalation and an art rig; that is its own item, not a rider on this one.
  [HOLLOW_ID]: { tileAt: hollowTileAt, tint: HOLLOW_TINT, water: (_cols, rows) => hollowPoolTile(rows) },
  // BACKLOG-478: the fifth ground, another row. Like the Hollow it takes no ZONE_BIAS entry (resource.ts)
  // and no structure kind — the same two documented back-compat seams, left alone deliberately.
  [RIDGE_ID]: { tileAt: ridgeTileAt, tint: RIDGE_TINT, water: (_cols, rows) => ridgeTarnTile(rows) },
};

/**
 * The terrain layout for a zone (BACKLOG-294/399/445, tabled by 449). An unknown zone id still returns
 * null → the caller bakes the plain grass map, the escape hatch that has kept the floor whole through
 * three terrain additions.
 */
export function zoneTileAt(zoneId: string, x: number, y: number, cols: number, rows: number): TileKind | null {
  return ZONE_TERRAIN[zoneId]?.tileAt(x, y, cols, rows) ?? null;
}

/**
 * Where a thirsty dino in this zone goes to drink (BACKLOG-445). Thirst has existed since cycle 80 with
 * exactly one place in the whole park to resolve it, which quietly made the need-pull (436) a no-op for
 * two zones out of three. Each zone now answers for itself, off its own terrain.
 */
export function zoneWaterTile(zoneId: string, cols: number, rows: number): { tileX: number; tileY: number } | null {
  return ZONE_TERRAIN[zoneId]?.water?.(cols, rows) ?? null;
}

/** The multiplicative floor tint for a zone (BACKLOG-294/378): grove cool, Fernreach warm, bowl untinted. */
export function zoneTint(zoneId: string): number {
  return ZONE_TERRAIN[zoneId]?.tint ?? NO_TINT;
}

/**
 * Is this dino at its own zone's water (BACKLOG-445) — any water tile of *that zone's* terrain within
 * `radius`? The zone-scoped counterpart of `arrival.ts`'s `nearPond`, which stays pointed at the grove on
 * purpose: the first-pond-sight beat (359) and the pond-swap gossip (346) are grove lore, and widening
 * them to "any water" would retro-fire a once-ever beat for every dino standing in the Fernreach creek.
 */
export function atWater(
  zoneId: string,
  tile: { tileX: number; tileY: number },
  cols: number,
  rows: number,
  radius = 1,
): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = tile.tileX + dx;
      const y = tile.tileY + dy;
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if (zoneTileAt(zoneId, x, y, cols, rows) === 'water') return true;
    }
  }
  return false;
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
  from: { tileX: number; tileY: number },
  cols: number,
  rows: number,
  edge: Edge | null = linkEdge(homeZone),
): { tileX: number; tileY: number } {
  // BACKLOG-478: a vertical crossing holds the column and walks to the top/bottom row — the mirror of what
  // a horizontal one has always done with the row. These three helpers took a bare `row` while every edge
  // was horizontal; they take the whole tile now, because which axis is preserved depends on the edge.
  if (edge === 'north') return { tileX: from.tileX, tileY: 0 };
  if (edge === 'south') return { tileX: from.tileX, tileY: rows - 1 };
  return { tileX: edge === 'west' ? 0 : cols - 1, tileY: from.tileY };
}

/** Has the migrant reached its crossing edge (so the next step crosses)? `edge` defaults to the primary link. */
export function atMigrationEdge(
  homeZone: string,
  tile: { tileX: number; tileY: number },
  cols: number,
  rows: number,
  edge: Edge | null = linkEdge(homeZone),
): boolean {
  if (edge === 'north') return tile.tileY <= 0;
  if (edge === 'south') return tile.tileY >= rows - 1;
  return edge === 'west' ? tile.tileX <= 0 : tile.tileX >= cols - 1;
}

/**
 * The entry tile in the *destination* zone — one tile in from the opposite edge, row preserved — where the
 * migrant reappears on crossing (a west-crossing enters the destination's east side; an east-crossing enters
 * its west side), mirroring `linkedZone`'s keeper entries. `edge` defaults to the home zone's primary link.
 */
export function crossEntryTile(
  homeZone: string,
  from: { tileX: number; tileY: number },
  cols: number,
  rows: number,
  edge: Edge | null = linkEdge(homeZone),
): { tileX: number; tileY: number } {
  if (edge === 'north') return { tileX: from.tileX, tileY: rows - 2 }; // BACKLOG-478
  if (edge === 'south') return { tileX: from.tileX, tileY: 1 };
  return { tileX: edge === 'west' ? cols - 2 : 1, tileY: from.tileY };
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
