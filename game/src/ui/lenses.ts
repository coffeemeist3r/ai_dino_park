/**
 * Observer lenses (BACKLOG-021 + 020 surfacing) — the player cycles a single key
 * through ways of *seeing* the emergent sim: a collection book, bond lines, role
 * tags, and a live event ticker. Every lens is a pure readout of state the sim
 * already produced — nothing here authors behavior. Pure (no Phaser): the scene
 * draws what these functions describe.
 */

import { pairKey } from '../social/meetings';
import type { Role } from '../ai/roles';
import { ZONES, zoneById } from '../world/zones';
import { hopDistances } from '../world/distance';
import { cropOf } from '../world/plot';
import type { ProsperityTier } from '../world/prosperity';
import { foodPileLine, type FoodPile } from '../world/foodstore';
import type { SpendPriority, WorkPriority } from '../world/governance';

export type Lens = 'off' | 'book' | 'bonds' | 'roles' | 'ticker' | 'map';
// 'map' (BACKLOG-425) is appended at the END so every pre-existing lens keeps its position on the ring.
export const LENS_ORDER: ReadonlyArray<Lens> = ['off', 'book', 'bonds', 'roles', 'ticker', 'map'];
export const LENS_LABEL: Record<Lens, string> = {
  off: '',
  book: '📖 Collection Book',
  bonds: '🔗 Bonds',
  roles: '🎭 Roles',
  ticker: '📰 Park News',
  map: '🗺 Zone Map',
};

/**
 * One box on the zone map (BACKLOG-425) — a pure readout the scene draws and `__zoneMap` returns:
 * the zone, its live head count, and whether the keeper is standing in it.
 */
export interface ZoneMapEntry {
  id: string;
  name: string;
  count: number;
  keeper: boolean;
  /** Prosperity tier (BACKLOG-428) — the zone's folded stockpile/structures/heads/harvest read; 'quiet' when unknown. */
  tier: ProsperityTier;
  /** Crops harvested from this zone's plot (BACKLOG-433) — the farming signal read on its own, beside the
   *  folded tier; 0 when unknown, so older callers/tests stay valid. */
  harvested: number;
  /** What this zone wants from a neighbour (BACKLOG-438) — the demand read, or null when no neighbour has a
   *  surplus of a crop this zone can't grow. */
  want: ZoneWant | null;
  /** Banked food (BACKLOG-446) — the zone's food stockpile as a glyph line (`🍓 2`), '' when empty so no
   *  banked line shows; older callers/tests omit the pile and read ''. */
  banked: string;
  /** Has this zone raised a granary (BACKLOG-454)? Shows a 🏛️ marker; false when unknown (older callers). */
  granary: boolean;
  /** Is this zone declining (BACKLOG-460) — has it lost residents from its peak? Shows a ⬇ marker; false
   *  when unknown (older callers). */
  declining: boolean;
  /** How this ground has chosen to spend (BACKLOG-468) — the provider-set policy (463) shown as 🍽️/🏦
   *  beside the tier; null when the zone has no policy or the caller didn't pass one (older callers). */
  spend: SpendPriority | null;
  /** What this ground puts its backs into (BACKLOG-473) — the provider-set work priority shown as 🧺/🧱
   *  beside the spend glyph; null when the zone has no policy or the caller didn't pass one. */
  work: WorkPriority | null;
  /** Has nobody ever lived here (BACKLOG-474)? An unsettled ground reads as unsettled rather than as a
   *  poor one — its prosperity is 0 by construction. False when unknown (older callers). */
  unsettled: boolean;
}

/**
 * A zone's demand (BACKLOG-438) — the crop it can't grow itself and the neighbour it would request it from.
 * Surfaced on the zone map lens; a read, not a mover (there's no banked food to ferry yet — that's 446/444).
 */
export interface ZoneWant {
  food: string; // the wanted crop's FOODS id
  glyph: string; // the wanted crop's ripe marker (cropOf(from).ripe)
  from: string; // the zone id to request it from (BACKLOG-475: no longer necessarily a neighbour)
  fromName: string; // that zone's display name
  hops?: number; // how far off that grower is (BACKLOG-475); absent on rows built before the distance read
}

/**
 * A zone wants what it can't grow (BACKLOG-438) — each zone farms exactly one crop (`cropOf`), so it's
 * structurally light on every other. Its carry-request leans toward the **nearest** ground producing a crop
 * it can't grow itself; among growers equally far off, the greatest harvest output (`harvests`, the 433
 * tally) wins — a demand that follows the productive farmer, but not clean across the park to do it
 * (BACKLOG-475: pre-475 this read neighbours only and ranked by output alone, which was the same thing while
 * the chain was three long). Strict `>` from a 0 floor: **null** until somebody has actually grown a
 * surplus, and chain order breaks the last tie (deterministic).
 */
export function zoneWant(zone: string, harvests: Record<string, number>): ZoneWant | null {
  const own = cropOf(zone).food;
  const dist = hopDistances(zone);
  let best: ZoneWant | null = null;
  let bestOut = 0;
  let bestHops = Infinity;
  for (const other of ZONES) {
    if (other.id === zone) continue;
    const hops = dist[other.id];
    if (hops === undefined) continue; // unreachable — a want it could never be answered
    const crop = cropOf(other.id);
    if (crop.food === own) continue; // grows the same crop — no new want
    const out = harvests[other.id] ?? 0;
    if (out === 0) continue; // the 0 floor: no want until somebody has actually grown a surplus
    // BACKLOG-475: nearest qualifying grower first; the greater harvest only decides between grounds that
    // are equally far off, and chain order breaks the last tie. Pre-475 this compared output alone across
    // the neighbours — which, once the chain grew a far end, pointed a zone's want clean across the park.
    if (hops < bestHops || (hops === bestHops && out > bestOut)) {
      bestHops = hops;
      bestOut = out;
      best = { food: crop.food, glyph: crop.ripe, from: other.id, fromName: zoneById(other.id).name, hops };
    }
  }
  return best;
}

/**
 * The zone map model: the chain in drawing order, counts from `zonePopulations`, keeper flagged, and each
 * zone's prosperity tier (BACKLOG-428) from the passed `tiers` map (a zone absent there reads 'quiet', so
 * older 3-arg callers/tests stay valid).
 */
export function zoneMapModel(
  chain: string[],
  populations: Record<string, number>,
  keeperZone: string,
  tiers: Record<string, ProsperityTier> = {},
  harvests: Record<string, number> = {},
  foodPiles: Record<string, FoodPile> = {},
  granaryZones: readonly string[] = [],
  declining: Record<string, boolean> = {},
  spends: Record<string, SpendPriority | null> = {},
  unsettled: Record<string, boolean> = {},
  works: Record<string, WorkPriority | null> = {},
): ZoneMapEntry[] {
  return chain.map((id) => ({
    id,
    name: zoneById(id).name,
    count: populations[id] ?? 0,
    keeper: id === keeperZone,
    tier: tiers[id] ?? 'quiet',
    harvested: harvests[id] ?? 0, // BACKLOG-433: the zone's own farming tally (absent → 0)
    want: zoneWant(id, harvests), // BACKLOG-438: what it wants from a neighbour (null until a neighbour has a surplus)
    banked: foodPileLine(foodPiles[id] ?? {}), // BACKLOG-446: the zone's banked food (absent → '')
    granary: granaryZones.includes(id), // BACKLOG-454: a raised granary shows a 🏛️ marker
    declining: declining[id] ?? false, // BACKLOG-460: a zone hollowed below its peak shows a ⬇ marker
    spend: spends[id] ?? null, // BACKLOG-468: how this ground has chosen to spend (absent → no policy shown)
    unsettled: unsettled[id] ?? false, // BACKLOG-474: a ground nobody has ever lived on (absent → false)
    work: works[id] ?? null, // BACKLOG-473: what this ground puts its backs into (absent → no policy shown)
  }));
}

export function nextLens(cur: Lens): Lens {
  const i = LENS_ORDER.indexOf(cur);
  return LENS_ORDER[(i + 1) % LENS_ORDER.length];
}

/** Bonded pairs at or above a points threshold, strongest first. */
export function bondedPairs(bonds: Record<string, number>, minPts: number): Array<{ a: string; b: string; points: number }> {
  const out: Array<{ a: string; b: string; points: number }> = [];
  for (const key of Object.keys(bonds)) {
    const points = bonds[key];
    if (points < minPts) continue;
    const [a, b] = key.split('|');
    if (a && b) out.push({ a, b, points });
  }
  return out.sort((x, y) => y.points - x.points);
}

/** Most recent `n` ticker events, newest last. */
export function tickerLines(events: string[], n = 8): string[] {
  return events.slice(-n);
}

export interface BookRow {
  name: string;
  species: string;
  hearts: number; // 0–10
  topBond: number; // 0–100
  role: Role;
  parents?: [string, string];
  rumorsHeard: number;
  /** Signature idle quirk label (BACKLOG-303) — the `fidget()` label, set by the live bookRows().
   *  Optional so older BookRow literals (tests) stay valid; the dossier always shows it in-game. */
  quirk?: string;
  /** Today's intent note (BACKLOG-393) — what the dino feels like doing with its day. */
  intent?: string;
  /** The day's shape (BACKLOG-012) — the lean per day-phase, dawn→night (e.g. `forage → social → solitary → rest`). */
  plans?: string;
  /** Where the dino has settled (BACKLOG-341) — `at home in <zone>`, set only once it belongs. */
  home?: string;
  /** Founding standing (BACKLOG-343) — `first across into <Zone>` for the first dino ever to arrive in a
   *  zone, undefined for everyone else (then no line shows). Built by `pioneerLine`. */
  pioneer?: string;
  /** What this dino has shown others (BACKLOG-364) — the ground it has told the most never-been dinos
   *  about, and how many tellings it carries. Undefined for a dino that has taught nobody. */
  taught?: string;
  /** The ground this dino currently misses (BACKLOG-362) — `misses <Zone>`, undefined when it longs for
   *  nowhere (then no line shows). Built by `yearnBookLine`. */
  yearn?: string;
  /** The ground this dino has just come back from (BACKLOG-347) — `just back from <Zone>`, undefined once
   *  the window closes (then no line shows). Built by `struckBookLine`, read live off tenure + cameFrom. */
  struck?: string;
  /** Food-web standing (BACKLOG-443) — a carnivore's catch tally / a herbivore's escape tally, or
   *  undefined when the dino has no food-web history (then no line shows). Built by `foodwebStanding`. */
  foodweb?: string;
}

function heartBar(hearts: number): string {
  return '♥'.repeat(hearts) + '·'.repeat(Math.max(0, 10 - hearts));
}

/** Render the collection book as display lines — one block per dino. */
export function bookLines(rows: BookRow[]): string[] {
  const out: string[] = ['— Collection Book —'];
  for (const r of rows) {
    out.push(`${r.name}  (${r.species})  [${r.role}]`);
    out.push(`  ${heartBar(r.hearts)}  bond:${r.topBond}`);
    if (r.quirk) out.push(`  · ${r.quirk}`); // BACKLOG-303: signature idle quirk as a kept fingerprint
    if (r.intent) out.push(`  today: ${r.intent}`); // BACKLOG-393: the day's intent, the mind made legible
    if (r.plans) out.push(`  plans: ${r.plans}`); // BACKLOG-012: the day's shape across its phases
    if (r.home) out.push(`  ${r.home}`); // BACKLOG-341: where it's settled, once it belongs to a zone
    if (r.pioneer) out.push(`  ${r.pioneer}`); // BACKLOG-343: the founding standing, kept forever
    if (r.taught) out.push(`  ${r.taught}`); // BACKLOG-364: the grounds it has shown others the way to
    if (r.yearn) out.push(`  ${r.yearn}`); // BACKLOG-362: the ground it has been away from too long
    if (r.struck) out.push(`  ${r.struck}`); // BACKLOG-347: the ground it is still full of
    if (r.parents) out.push(`  child of ${r.parents[0]} + ${r.parents[1]}`);
    if (r.foodweb) out.push(`  ${r.foodweb}`); // BACKLOG-443: food-web standing (catches / escapes)
    if (r.rumorsHeard > 0) out.push(`  knows ${r.rumorsHeard} rumor${r.rumorsHeard === 1 ? '' : 's'}`);
  }
  return out;
}

/** Re-export so the scene and tests share one pair key. */
export { pairKey };
