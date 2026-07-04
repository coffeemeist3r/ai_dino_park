/**
 * Observer lenses (BACKLOG-021 + 020 surfacing) — the player cycles a single key
 * through ways of *seeing* the emergent sim: a collection book, bond lines, role
 * tags, and a live event ticker. Every lens is a pure readout of state the sim
 * already produced — nothing here authors behavior. Pure (no Phaser): the scene
 * draws what these functions describe.
 */

import { pairKey } from '../social/meetings';
import type { Role } from '../ai/roles';
import { zoneById } from '../world/zones';

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
}

/** The zone map model: the chain in drawing order, counts from `zonePopulations`, keeper flagged. */
export function zoneMapModel(chain: string[], populations: Record<string, number>, keeperZone: string): ZoneMapEntry[] {
  return chain.map((id) => ({
    id,
    name: zoneById(id).name,
    count: populations[id] ?? 0,
    keeper: id === keeperZone,
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
    if (r.parents) out.push(`  child of ${r.parents[0]} + ${r.parents[1]}`);
    if (r.rumorsHeard > 0) out.push(`  knows ${r.rumorsHeard} rumor${r.rumorsHeard === 1 ? '' : 's'}`);
  }
  return out;
}

/** Re-export so the scene and tests share one pair key. */
export { pairKey };
