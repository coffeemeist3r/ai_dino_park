/**
 * Observer lenses (BACKLOG-021 + 020 surfacing) — the player cycles a single key
 * through ways of *seeing* the emergent sim: a collection book, bond lines, role
 * tags, and a live event ticker. Every lens is a pure readout of state the sim
 * already produced — nothing here authors behavior. Pure (no Phaser): the scene
 * draws what these functions describe.
 */

import { pairKey } from '../social/meetings';
import type { Role } from '../ai/roles';
import { zoneById, zoneNeighbors } from '../world/zones';
import { cropOf } from '../world/plot';
import type { ProsperityTier } from '../world/prosperity';
import { foodPileLine, type FoodPile } from '../world/foodstore';

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
}

/**
 * A zone's demand (BACKLOG-438) — the crop it can't grow itself and the neighbour it would request it from.
 * Surfaced on the zone map lens; a read, not a mover (there's no banked food to ferry yet — that's 446/444).
 */
export interface ZoneWant {
  food: string; // the wanted crop's FOODS id
  glyph: string; // the wanted crop's ripe marker (cropOf(from).ripe)
  from: string; // the neighbour zone id to request it from
  fromName: string; // that neighbour's display name
}

/**
 * A zone wants what it can't grow (BACKLOG-438) — each zone farms exactly one crop (`cropOf`), so it's
 * structurally light on every other. Its carry-request leans toward the linked neighbour producing the most
 * of a crop it can't grow itself: among neighbours whose crop differs from this zone's, the one with the
 * greatest harvest output (`harvests`, the 433 tally) wins — a demand that follows the productive farmer.
 * Strict `>` from a 0 floor: **null** until some neighbour has actually grown a surplus, and the first
 * neighbour in link order wins a tie (deterministic).
 */
export function zoneWant(zone: string, harvests: Record<string, number>): ZoneWant | null {
  const own = cropOf(zone).food;
  let best: ZoneWant | null = null;
  let bestOut = 0;
  for (const l of zoneNeighbors(zone)) {
    const crop = cropOf(l.to);
    if (crop.food === own) continue; // neighbour grows the same crop — no new want
    const out = harvests[l.to] ?? 0;
    if (out > bestOut) {
      bestOut = out;
      best = { food: crop.food, glyph: crop.ripe, from: l.to, fromName: zoneById(l.to).name };
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
    if (r.parents) out.push(`  child of ${r.parents[0]} + ${r.parents[1]}`);
    if (r.foodweb) out.push(`  ${r.foodweb}`); // BACKLOG-443: food-web standing (catches / escapes)
    if (r.rumorsHeard > 0) out.push(`  knows ${r.rumorsHeard} rumor${r.rumorsHeard === 1 ? '' : 's'}`);
  }
  return out;
}

/** Re-export so the scene and tests share one pair key. */
export { pairKey };
