/**
 * Places in the plan (BACKLOG-586) — two of the plan's four leans are about going somewhere.
 *
 * `forage` ("food on the brain") and `restless` ("itchy feet") never named a place: a dino only crossed grounds when
 * the migration roll picked it. Now those phases name a destination. A restless dino picks a linked neighbouring
 * ground, seeded by name+day+phase; a foraging dino picks the neighbour richer than home, or forages at home. The
 * scene sends the dino there on purpose — an errand, not a roll.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable.
 */

import { hashSeed, mulberry32 } from './personality';
import { type IntentKind } from './intent';
import { type DayPhase } from '../world/dayNight';

export const ERRAND_GLYPH = '🧭';
export const ERRAND_ART_KEY = 'errand';

/** Where today's `phase` sends `name`, or null when the lean stays put. `neighbours` are linked grounds from `home`. */
export function planPlace(
  name: string,
  day: number,
  phase: DayPhase,
  kind: IntentKind,
  home: string,
  neighbours: readonly string[],
  appeal: (zone: string) => number,
): string | null {
  const ns = [...new Set(neighbours)].filter((z) => z !== home).sort();
  if (!ns.length) return null;
  if (kind === 'restless') return ns[Math.floor(mulberry32(hashSeed(`${name}#place#${day}#${phase}`))() * ns.length)];
  if (kind !== 'forage') return null;
  let best = home;
  for (const z of ns) if (appeal(z) > appeal(best)) best = z;
  return best === home ? null : best;
}

const WHY: Partial<Record<IntentKind, string>> = {
  restless: 'itchy feet',
  forage: 'after the food there',
};

/** The ticker line as it sets off. */
export function errandLine(name: string, zoneName: string, kind: IntentKind): string {
  return `${ERRAND_GLYPH} ${name} sets off for ${zoneName} — ${WHY[kind] ?? 'on an errand'}.`;
}

/** The book's "heading:" line. */
export function headingLine(zoneName: string, kind: IntentKind): string {
  return `${zoneName} (${WHY[kind] ?? 'an errand'})`;
}
