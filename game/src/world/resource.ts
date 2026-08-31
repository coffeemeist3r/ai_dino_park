/**
 * Resource gathering spine (BACKLOG-146) — the first beat of the resources→crafting→building arc.
 * A raw resource (a fallen branch or a shiny stone) occasionally appears in the bowl; a curious dino
 * notices it, walks over, and picks it up (a per-dino tally). Gathering only — banking into a shared
 * stockpile is BACKLOG-285, crafting is BACKLOG-286.
 *
 * Pure (no Phaser): the notice decision, the landing tile, and the spawn roll are all decided here and
 * unit-tested; WorldScene draws the glyph, drives the fetch off the world clock, and reuses the feeding
 * spine's `stepToward` (movement) + `reachedFood` (arrival) so this never reinvents either.
 *
 * Mirror of world/feeding.ts: food attracts the hungry by energy, a resource attracts the curious by
 * curiosity. Food stays the higher movement priority in WorldScene (a hungry rush wins a tug-of-war).
 */

import type { Tile } from './movement';
import { BOWL_ID, GROVE_ID, FERNREACH_ID, RIDGE_ID } from './zones';
import { rand as worldRand } from './rng';

export type ResourceKind = 'branch' | 'stone' | 'frond' | 'obsidian';

/**
 * BACKLOG-503: `obsidian` is appended **last** on purpose. This map's key order is `KINDS` in `upkeep.ts`
 * and the iteration order of `pickCarry` / `directedCarry` / `pressuredCarry` / `stockpileLine`, all of
 * which break ties by it. A fourth kind at the end leaves every tie among the first three untouched.
 */
export const RESOURCE_GLYPH: Record<ResourceKind, string> = { branch: '🪵', stone: '🪨', frond: '🌾', obsidian: '🌑' };

export const RESOURCE_RANGE = 6; // tiles — beyond this a resource goes unnoticed
const CURIOUS = 0.35; // curiosity at/above which a dino bothers to fetch
export const RESOURCE_SPAWN_CHANCE = 0.12; // per spawn-roll (only rolled when none is present)

/**
 * Legible gathering (BACKLOG-297): a freshly fallen resource sits for a grace window before any dino
 * fetches it, so the player actually catches it appearing instead of it vanishing the same tick a
 * curious dino reaches it. WorldScene ages the resource one step per `forceStep`.
 */
export const RESOURCE_GRACE_STEPS = 3;

/** Has a resource sat long enough (in world steps) to be fetched? */
export function resourceFetchable(ageSteps: number): boolean {
  return ageSteps >= RESOURCE_GRACE_STEPS;
}

export type GatherReaction = 'fetch' | 'ignore';

/** Does a dino notice and go fetch a resource, given its curiosity (0..1) and distance in tiles? */
export function noticeResource(curiosity: number, distTiles: number): GatherReaction {
  if (distTiles > RESOURCE_RANGE) return 'ignore';
  return curiosity >= CURIOUS ? 'fetch' : 'ignore';
}

/** Where a resource appears: a random in-bounds tile, kept off the very rim so it lands among the cast. */
export function resourceLanding(cols: number, rows: number, rand: () => number = worldRand): Tile {
  const span = (n: number) => 1 + Math.floor(rand() * Math.max(1, n - 2)); // [1, n-2]
  return { tileX: span(cols), tileY: span(rows) };
}

/** Whether a resource spawns this roll (only call when none is present). */
export function rollResource(rand: () => number = worldRand): boolean {
  return rand() < RESOURCE_SPAWN_CHANCE;
}

/**
 * Zone resource bias (BACKLOG-348) — each zone leans its roll toward its own character: the grove's
 * trees drop 🪵 branches, the bowl's open ground turns up 🪨 stones. A *lean*, not a lock — the off-kind
 * still rolls past `BIAS_WEIGHT` — so the two zone economies (328) gather *different* things and carry
 * between them (329) has a point. An unbiased/omitted zone keeps the old uniform 50/50 (back-compat).
 *
 * Third-zone bias (BACKLOG-400): the Fernreach (378) leans a third kind, a 🌾 frond, so the 3-zone chain
 * gathers three different things. Frond is favored *only* here — the off-kind below is always a primary
 * (branch/stone), so a new favored kind never leaks into another zone's roll (bowl/grove stay byte-identical).
 */
export const ZONE_BIAS: Record<string, ResourceKind> = {
  [BOWL_ID]: 'stone',
  [GROVE_ID]: 'branch',
  [FERNREACH_ID]: 'frond',
  // BACKLOG-503: the Ridge's entry is a bias *and* an exclusivity (below). It has to be here as well as in
  // ZONE_EXCLUSIVE because `zoneStructure` reads the bias to decide what a ground builds — a Ridge that
  // gathers nothing but obsidian and still carried CRAFT_RECIPE would be a ground that can never build.
  [RIDGE_ID]: 'obsidian',
};

/**
 * Zone-exclusive resource (BACKLOG-503) — the difference between a *lean* and a *lock*.
 *
 * `ZONE_BIAS` above weights a roll; the off-kind still turns up past `BIAS_WEIGHT`, which is why the three
 * biased grounds have always been three flavours of the same economy. The Ridge is the one ground in this
 * park a player reaches by deciding to rather than by continuing to walk east, and until now it grew what
 * the line grew and banked what the line banked — so every migration heuristic that weighed it was choosing
 * between two identical arguments.
 *
 * A ground listed here rolls its exclusive kind and **nothing else**, and that kind rolls **nowhere else**:
 * `pickKind`'s off-kind is always a primary (branch/stone), so an exclusive kind can never leak into another
 * ground's roll the way 400 was careful the frond never could. That is what makes obsidian a thing a dino
 * has to *go* for — the first resource in this park with a place.
 */
export const ZONE_EXCLUSIVE: Record<string, ResourceKind> = {
  [RIDGE_ID]: 'obsidian',
};
export const BIAS_WEIGHT = 0.75; // chance the favored kind rolls in its biased zone (vs 0.5 uniform)

/**
 * Pick which kind appears — uniform 50/50 with no zone, leaning to the zone's bias (348/400), or *locked*
 * to the zone's exclusive kind (503). The exclusivity is checked first and consumes no randomness, so the
 * Ridge's roll is the same shard whatever the stream says and every other ground is byte-identical.
 */
export function pickKind(rand: () => number = worldRand, zone?: string): ResourceKind {
  const only = zone ? ZONE_EXCLUSIVE[zone] : undefined;
  if (only) return only;
  const favored = zone ? ZONE_BIAS[zone] : undefined;
  if (!favored) return rand() < 0.5 ? 'branch' : 'stone';
  // The off-kind is intentionally a primary (branch↔stone), never the favored's "opposite" among all
  // kinds — so the Fernreach's frond (400) can't surface as an off-roll in the bowl or grove.
  const other: ResourceKind = favored === 'branch' ? 'stone' : 'branch';
  return rand() < BIAS_WEIGHT ? favored : other;
}

/**
 * Shared per-kind park stockpile (BACKLOG-285) — where gathered resources bank. 146 raised a per-dino
 * tally that nothing read; this is the park-level total the rest of the build arc (286 craft, 029) spends.
 */
export type Stockpile = Partial<Record<ResourceKind, number>>;

/**
 * Stockpile capacity (BACKLOG-309) — the first economy constraint. The shared pile was unbounded, so
 * gathering accrued forever with no reason to spend. Each kind now caps; banking at cap stalls (the
 * gather is consumed but nothing banks) until a craft (286) spends the kind back below the cap.
 */
export const STOCKPILE_CAP = 8;

/** Is this kind's pile at (or over) the per-kind cap — i.e. banking more of it would stall? */
export function atCap(pile: Stockpile, kind: ResourceKind): boolean {
  return (pile[kind] ?? 0) >= STOCKPILE_CAP;
}

/**
 * Bank one gathered resource into the shared stockpile. Pure — returns a new map, never mutates `pile`.
 * Clamps at STOCKPILE_CAP (BACKLOG-309): a kind already at cap returns the pile unchanged.
 */
export function bankResource(pile: Stockpile, kind: ResourceKind): Stockpile {
  if (atCap(pile, kind)) return pile;
  return { ...pile, [kind]: (pile[kind] ?? 0) + 1 };
}

/** One-line glyph readout for the plaque (`🪵 3 · 🪨 1`); lists only kinds banked, '' when empty. */
export function stockpileLine(pile: Stockpile): string {
  return (Object.keys(RESOURCE_GLYPH) as ResourceKind[])
    .filter((k) => (pile[k] ?? 0) > 0)
    .map((k) => `${RESOURCE_GLYPH[k]} ${pile[k]}`)
    .join(' · ');
}

/**
 * First craft (BACKLOG-286) — the first resources→craft step. Once the shared stockpile (285) covers
 * one fixed recipe, a dino combines the banked branches and stones into a single crafted object: a cairn.
 * One recipe, one output; multi-recipe crafting and building stay deferred to 029. Pure — WorldScene owns
 * the placed sprite + persistence.
 */
export const CRAFT_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 3, stone: 2 };
export const CAIRN_GLYPH = '🗿';

/** Can the stockpile afford one cairn — does it cover every kind the recipe needs? */
export function canCraft(pile: Stockpile): boolean {
  return (Object.keys(CRAFT_RECIPE) as ResourceKind[]).every((k) => (pile[k] ?? 0) >= (CRAFT_RECIPE[k] ?? 0));
}

/** Spend one cairn's worth of resources. Pure — returns a new pile minus the recipe, or null if unaffordable. */
export function craft(pile: Stockpile): Stockpile | null {
  if (!canCraft(pile)) return null;
  const next: Stockpile = { ...pile };
  for (const k of Object.keys(CRAFT_RECIPE) as ResourceKind[]) {
    next[k] = (next[k] ?? 0) - (CRAFT_RECIPE[k] ?? 0);
  }
  return next;
}

/**
 * Dino-built shelter (BACKLOG-315) — the second, larger structure beyond the cairn (286). At a higher
 * build bar a dino raises a lean-to: placed/persisted/zone-scoped exactly like the cairn, a real landmark
 * of its zone. The next resources→build beat. Pure (WorldScene owns the sprite + persistence); the
 * helpers below are structural twins of `canCraft`/`craft` over a richer recipe.
 *
 * The escalation gate is a *cairn count*, not just a pile size: the cairn auto-crafts at CRAFT_RECIPE on
 * every gather, draining the shared pile, so it can never climb to the richer SHELTER_RECIPE while cairns
 * keep firing. Once a zone has stacked SHELTER_AFTER_CAIRNS cairns, WorldScene stops draining it on cairns
 * and saves toward one shelter (one landmark per zone) — the lazy correct way to let the pile reach {6,4}
 * without touching the cairn path (so every cairn spec stays green).
 */
export const SHELTER_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 6, stone: 4 };
export const SHELTER_GLYPH = '🛖';
export const SHELTER_AFTER_CAIRNS = 3; // cairns a zone stacks before it starts saving for a lean-to

/** Can the stockpile afford one shelter — does it cover every kind the richer recipe needs? */
export function canBuildShelter(pile: Stockpile): boolean {
  return (Object.keys(SHELTER_RECIPE) as ResourceKind[]).every((k) => (pile[k] ?? 0) >= (SHELTER_RECIPE[k] ?? 0));
}

/** Spend one shelter's worth of resources. Pure — returns a new pile minus the recipe, or null if unaffordable. */
export function buildShelter(pile: Stockpile): Stockpile | null {
  if (!canBuildShelter(pile)) return null;
  const next: Stockpile = { ...pile };
  for (const k of Object.keys(SHELTER_RECIPE) as ResourceKind[]) {
    next[k] = (next[k] ?? 0) - (SHELTER_RECIPE[k] ?? 0);
  }
  return next;
}

/**
 * Carry between zones (BACKLOG-329) — the first link between two per-zone piles (328). A dino crossing
 * zones ferries one banked resource from the pile it leaves into the pile it enters. These two pure
 * helpers decide *what* moves; WorldScene applies the transfer in `crossDino` (the visible crossing only).
 */

/**
 * Which kind to ferry `src → dest`: the most-stocked kind in `src` that `dest` can still accept (not at
 * cap), or null when nothing can move (src empty, or dest full for every kind src has). Deterministic —
 * the stable sort keeps `RESOURCE_GLYPH` order (branch before stone) on a count tie.
 */
export function pickCarry(src: Stockpile, dest: Stockpile): ResourceKind | null {
  const kinds = (Object.keys(RESOURCE_GLYPH) as ResourceKind[])
    .filter((k) => (src[k] ?? 0) > 0 && !atCap(dest, k))
    .sort((x, y) => (src[y] ?? 0) - (src[x] ?? 0));
  return kinds[0] ?? null;
}

/**
 * Directed carry (BACKLOG-356) — which kind to ferry `src → dest` so the trade route actively *balances*
 * the two economies instead of moving a random spare (329's `pickCarry`). Prefers the recipe kind `dest` is
 * most short of for its next craft (`CRAFT_RECIPE`, the always-on cairn) that `src` can supply (>0) and
 * `dest` can still accept (not at cap). When `dest` has no fillable craft shortfall, falls back to
 * `pickCarry` so a spare still moves (carry stays lossless and never a needless no-op). Deterministic — the
 * `RESOURCE_GLYPH` iteration order keeps branch-before-stone on a deficit tie (stable sort).
 */
export function directedCarry(
  src: Stockpile,
  dest: Stockpile,
  recipe: Partial<Record<ResourceKind, number>> = CRAFT_RECIPE,
): ResourceKind | null {
  const needed = (Object.keys(RESOURCE_GLYPH) as ResourceKind[])
    .map((k) => ({ k, deficit: (recipe[k] ?? 0) - (dest[k] ?? 0) }))
    .filter((x) => x.deficit > 0 && (src[x.k] ?? 0) > 0 && !atCap(dest, x.k))
    .sort((a, b) => b.deficit - a.deficit);
  return needed[0]?.k ?? pickCarry(src, dest);
}

/**
 * Zone carry pressure (BACKLOG-429) — the first inter-zone economic *pressure*. A zone's pile has a soft
 * cap on its total (below the per-kind hard cap, so it bites first): once a zone is over it, a dino leaving
 * it toward a *strictly lighter* neighbour sheds harder — it ferries the glut (its most-stocked acceptable
 * kinds, `pickCarry`), up to `PRESSURE_CARRY` units, so banked resources flow toward need instead of piling
 * forever in one zone. Below the soft cap, or toward a heavier/equal neighbour, it's byte-identical to the
 * single directed carry (356/377): resources are never pushed into an already-fuller zone.
 */
export const STOCKPILE_SOFT_CAP = 6; // per-zone total; over this a glutted zone sheds toward a lighter neighbour
export const PRESSURE_CARRY = 2; // most units a crossing sheds under pressure (a lean, not a firehose)

/** A pile's total across all kinds. */
export function pileTotal(pile: Stockpile): number {
  return (Object.keys(RESOURCE_GLYPH) as ResourceKind[]).reduce((s, k) => s + (pile[k] ?? 0), 0);
}

/** Is a zone's pile over its soft cap — i.e. glutted enough to shed surplus under pressure? */
export function overSoftCap(pile: Stockpile): boolean {
  return pileTotal(pile) > STOCKPILE_SOFT_CAP;
}

/**
 * The kinds to ferry `src → dest` this crossing (BACKLOG-429). Normal (src not over its soft cap, or `dest`
 * not strictly lighter than `src`) → the single directed kind (356/377), or `[]` when nothing can move —
 * byte-identical to the old carry. Under pressure (src over cap AND `dest` strictly lighter) → up to
 * `PRESSURE_CARRY` of the most-stocked kinds `dest` can still accept, each simulated on working copies so
 * every unit re-checks the destination cap (lossless + cap-safe). Deterministic (stable `pickCarry`).
 */
export function pressuredCarry(
  src: Stockpile,
  dest: Stockpile,
  recipe: Partial<Record<ResourceKind, number>> = CRAFT_RECIPE,
): ResourceKind[] {
  if (!(overSoftCap(src) && pileTotal(dest) < pileTotal(src))) {
    const one = directedCarry(src, dest, recipe);
    return one ? [one] : [];
  }
  const out: ResourceKind[] = [];
  let s: Stockpile = { ...src };
  let d: Stockpile = { ...dest };
  for (let i = 0; i < PRESSURE_CARRY; i++) {
    const k = pickCarry(s, d);
    if (!k) break;
    out.push(k);
    s = takeResource(s, k);
    d = bankResource(d, k);
  }
  return out;
}

/**
 * Zone-distinct craft (BACKLOG-377) — each zone builds the structure its resource bias (348) favors,
 * so the two zones' *built landscapes* diverge, not only their piles. The stone-rich bowl stacks 🗿
 * cairns; the branch-rich grove raises 🛖 lean-tos. This replaces the zone-agnostic cairn→lean-to
 * escalation (286/315 `SHELTER_AFTER_CAIRNS`) with a one-structure-per-zone choice keyed off ZONE_BIAS.
 * The pile-math (`craft`/`buildShelter`) and recipes are unchanged — only the *selection* moves here.
 */
export type Structure = 'cairn' | 'shelter' | 'thatch' | 'beacon';

/**
 * Woven frond thatch (BACKLOG-417) — the Fernreach's own built landmark, the third structure beyond the
 * bowl's cairn and the grove's lean-to. Made *of* fronds (the kind the Fernreach actually gathers under
 * its bias, 400), the way the lean-to is made of branches — so the frond-rich third zone finally spends
 * its own gather on its own skyline instead of scraping cairns off its 25% off-kind. The 🥻 pixel rig was
 * stashed ahead of this item (BACKLOG-427); this wires it into the world. Twin recipe of cairn/lean-to.
 */
export const THATCH_RECIPE: Partial<Record<ResourceKind, number>> = { frond: 4 };
export const THATCH_GLYPH = '🥻';

/**
 * The Ridge's beacon (BACKLOG-503) — the fourth structure, and the only one made of something you cannot
 * gather anywhere else. Shards of black glass set upright in a stack, on the one ground in the park that
 * hangs off a branch rather than sitting on the line. Twin recipe of the cairn / lean-to / thatch: the
 * `structureRecipe` table below routes it and `buildStructureFor` spends it, so no fourth bespoke
 * afford/spend pair was needed. The glyph is the graceful fallback until BACKLOG-508 draws the rig.
 */
export const BEACON_RECIPE: Partial<Record<ResourceKind, number>> = { obsidian: 3 };
export const BEACON_GLYPH = '🗼';

/**
 * A zone's bias kind → the landmark it raises: stone stacks cairns, branch raises lean-tos, frond weaves
 * a thatch (BACKLOG-417). Total over the ResourceKind union so a new kind can never silently fall through
 * to a default.
 */
export const STRUCTURE_BY_BIAS: Record<ResourceKind, Structure> = { stone: 'cairn', branch: 'shelter', frond: 'thatch', obsidian: 'beacon' };

/** Which structure a zone builds, by its bias. An unbiased/unknown zone → 'cairn' (286 default, back-compat). */
export function zoneStructure(zone?: string): Structure {
  const bias = zone ? ZONE_BIAS[zone] : undefined;
  return bias ? STRUCTURE_BY_BIAS[bias] : 'cairn';
}

/**
 * The tithe (BACKLOG-509) — what every ground but the source owes the Ridge before it raises anything.
 *
 * 503 gave the Ridge an exclusive resource and gave exactly two things a reason to want it: the Ridge's own
 * beacon, and one unit in `GRANARY_RECIPE`. So a ground that had fetched one shard had no reason to fetch a
 * second until it was granary-ready, and a park with a granary on every ground had no reason to climb
 * again ever. Folding a shard into every other ground's own structure makes the branch load-bearing for the
 * **whole built landscape** rather than for one storehouse: no skyline anywhere in this park goes up
 * without somebody having made the climb.
 *
 * Deliberately not stacked onto `GRANARY_RECIPE`, which already carries its own shard on its own path. A
 * later cycle tempted to "fix" that inconsistency should read this line first: they are two recipes, and
 * one tithe each is the rule.
 */
export const TITHE = 1;

/** The recipe a zone's structure costs — the cairn (286), the lean-to (315), the frond thatch (417), or
 *  the Ridge's beacon (503) — plus the tithe (509) for every ground that is not the source itself. */
export function structureRecipe(zone?: string): Partial<Record<ResourceKind, number>> {
  const kind = zoneStructure(zone);
  const base =
    kind === 'shelter' ? SHELTER_RECIPE : kind === 'thatch' ? THATCH_RECIPE : kind === 'beacon' ? BEACON_RECIPE : CRAFT_RECIPE;
  // BACKLOG-509: the source ground is exempt — a ground tithing to itself is a rounding error dressed as a
  // rule. The kind is read off ZONE_EXCLUSIVE rather than named here, so a park that moves the stake (or
  // grows a second one) moves it in the one place `quarryKind` already reads.
  const tithed = Object.values(ZONE_EXCLUSIVE)[0];
  if (!tithed || kind === 'beacon') return base;
  return { ...base, [tithed]: (base[tithed] ?? 0) + TITHE };
}

/**
 * What a ground's next structure is still short of, per kind (BACKLOG-509). One derivation, read by both
 * the map lens (which says what a ground is waiting on) and the errand tier (which decides whether to send
 * somebody for it) — so the recipe is never written down a second time. That is BACKLOG-519's lesson,
 * applied before it could happen again.
 */
export function recipeShortfall(pile: Stockpile, zone?: string): Partial<Record<ResourceKind, number>> {
  const recipe = structureRecipe(zone);
  const out: Partial<Record<ResourceKind, number>> = {};
  for (const k of Object.keys(recipe) as ResourceKind[]) {
    const missing = (recipe[k] ?? 0) - (pile[k] ?? 0);
    if (missing > 0) out[k] = missing;
  }
  return out;
}

/**
 * Is the tithe the *only* thing between this ground and its next landmark (BACKLOG-509)?
 *
 * The narrowness is the point. 503 found that promoting the quarry errand unconditionally "made every
 * migration an errand and took the scarcity system dormant" — the CHARTER v7 corollary arrived at from the
 * other side. A ground short of two kinds still migrates on appeal exactly as it does today; only a ground
 * standing there with everything but the shard is worth sending up the hill.
 */
export function shortOnlyTithe(pile: Stockpile, zone?: string): boolean {
  const tithed = Object.values(ZONE_EXCLUSIVE)[0];
  if (!tithed) return false;
  // The source ground is never short of a *tithe* — it is short of its own recipe, which happens to be
  // made of the same stuff. Without this the Ridge reads as owing itself an errand it can never run.
  if (zone && zone in ZONE_EXCLUSIVE) return false;
  const short = Object.keys(recipeShortfall(pile, zone)) as ResourceKind[];
  return short.length === 1 && short[0] === tithed;
}

/**
 * Build a zone's *own* structure (BACKLOG-417) — the general form of `craft`/`buildShelter` over whatever
 * `structureRecipe(zone)` returns, so a new zone-structure (the thatch, and any future kind) needs no fourth
 * bespoke afford/spend pair. Returns a new pile minus the zone's recipe, or null when unaffordable. Pure —
 * never mutates `pile`. The per-structure helpers stay exported (their unit tests + the barter fallback).
 */
export function buildStructureFor(pile: Stockpile, zone?: string): Stockpile | null {
  const recipe = structureRecipe(zone);
  const kinds = Object.keys(recipe) as ResourceKind[];
  if (!kinds.every((k) => (pile[k] ?? 0) >= (recipe[k] ?? 0))) return null;
  const next: Stockpile = { ...pile };
  for (const k of kinds) next[k] = (next[k] ?? 0) - (recipe[k] ?? 0);
  return next;
}

/** Remove one of `kind` from a pile (floored at 0). Pure — returns a new map, never mutates. */
export function takeResource(pile: Stockpile, kind: ResourceKind): Stockpile {
  const have = pile[kind] ?? 0;
  if (have <= 0) return pile;
  return { ...pile, [kind]: have - 1 };
}

/**
 * Edge-meet barter (BACKLOG-358) — the converse of one-way carry (329/356/377). When two dinos from
 * different zones meet at their shared edge, each zone hands the other the kind it's *short of* for its own
 * next structure. This is just `directedCarry` run in both directions: A gives B what B needs (`recipeB`),
 * B gives A what A needs (`recipeA`), each falling back to a spare when there's no craft shortfall. Either
 * side can be null (that giver has nothing the other can take). WorldScene applies the two moves on the same
 * lossless `takeResource`→`bankResource` path carry uses, so a barter is conserved and cap-safe.
 */
export interface BarterSwap {
  aGives: ResourceKind | null;
  bGives: ResourceKind | null;
}

export function barterSwap(
  pileA: Stockpile,
  pileB: Stockpile,
  recipeA: Partial<Record<ResourceKind, number>> = CRAFT_RECIPE,
  recipeB: Partial<Record<ResourceKind, number>> = CRAFT_RECIPE,
): BarterSwap {
  return {
    aGives: directedCarry(pileA, pileB, recipeB), // A → B: what B is short of for B's structure
    bGives: directedCarry(pileB, pileA, recipeA), // B → A: what A is short of for A's structure
  };
}
