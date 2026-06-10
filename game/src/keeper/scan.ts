/**
 * Field Scan (BACKLOG-157, first ability) — LUMEN-3's distinct power. The cataloguing unit that
 * escaped the archives can do what no other observer can: read a living mind. The scan is a pure
 * readout of state the sim already owns (personality axes, mood, favorite food, emergent role) —
 * it reveals, it never authors.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene only paints the lines.
 */

import { AXES, type Personality } from '../ai/personality';
import { moodFromTraits } from '../ai/brain';
import { favoriteFood } from '../world/foods';
import type { Season } from '../world/seasons';
import type { Role } from '../ai/roles';
import type { Keeper } from './keepers';

export interface ScanSubject {
  name: string;
  species: string;
  traits: Personality;
  role: Role;
}

/** Only the cataloguing unit carries the sensors for reading a mind. */
export function canScan(keeper: Keeper): boolean {
  return keeper.id === 'lumen';
}

const METER_CELLS = 10;

function meter(v: number): string {
  const filled = Math.max(0, Math.min(METER_CELLS, Math.round(v * METER_CELLS)));
  return '▮'.repeat(filled) + '▯'.repeat(METER_CELLS - filled);
}

/**
 * The dossier LUMEN-3 reads off a dino. Deterministic: pure formatting over the subject.
 * With `season` given, the favorite-food line reflects that season's craving (BACKLOG-170).
 */
export function scanLines(subject: ScanSubject, season?: Season): string[] {
  const lines = [
    `— Field Scan: ${subject.name} —`,
    `${subject.species} · [${subject.role}]`,
  ];
  for (const axis of AXES) {
    lines.push(`${axis.low.padStart(8)} ${meter(subject.traits[axis.key])} ${axis.high}`);
  }
  lines.push(`mood: ${moodFromTraits(subject.traits)}`);
  const fav = favoriteFood(subject.traits, season);
  lines.push(`loves ${fav.emoji} ${fav.label}`);
  return lines;
}

const REFUSALS: Record<string, string> = {
  aether: 'AETHER-1: "A diplomat does not pry into a mind. I read the room, not the soul."',
  vanta: 'VANTA-9: "My sensors map terrain, not temperament. No scan."',
};

/** An in-character demurral for observers without the Scholar's sensors. Empty for LUMEN-3. */
export function scanRefusal(keeper: Keeper): string {
  if (canScan(keeper)) return '';
  return REFUSALS[keeper.id] ?? `${keeper.name}: "This unit cannot parse a living mind."`;
}
