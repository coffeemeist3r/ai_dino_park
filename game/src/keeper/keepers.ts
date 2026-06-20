/**
 * The keepers — a small roster of time-traveling robot observers the player chooses to *be*
 * (BACKLOG-155). Not natives of the bowl: machines that drifted back across the eras to watch the
 * dinos, each with its own designation, the era it came from, and a distinct ability.
 *
 * Pure TypeScript (no Phaser): Node-testable. The ability this cycle is a personality **fit** —
 * the chosen observer makes dinos whose temperament matches its `appeal` warm to the keeper a
 * little faster. Mirrors social/tones.ts: an `appeal` over personality axes, scored the same way.
 * The richer LLM-authored backstory (156) and the other abilities (157) build on this spine.
 */

import type { Personality } from '../ai/personality';

export interface KeeperAbility {
  label: string;
  desc: string;
  /** Personality axes this observer resonates with → a small affinity bonus. Weights in [-1, 1]. */
  appeal: Partial<Personality>;
}

export interface Keeper {
  id: string;
  name: string; // unit designation + nickname
  era: string; // when it travelled back from
  backstory: string; // one line; the LLM-authored version is BACKLOG-156
  ability: KeeperAbility;
}

// Order is the picker order (1 / 2 / 3). KEEPERS[0] is the default observer.
export const KEEPERS: ReadonlyArray<Keeper> = [
  {
    id: 'aether',
    name: 'AETHER-1 "Aki"',
    era: 'the 41st century',
    backstory:
      'A diplomacy unit retired after the Quiet Accord, it drifted back to watch creatures that never learned to argue.',
    ability: {
      label: 'Empath Protocol',
      desc: 'Gentle, sociable dinos warm to you faster.',
      appeal: { agreeableness: 1, sociability: 0.5 },
    },
  },
  {
    id: 'vanta',
    name: 'VANTA-9 "Vix"',
    era: 'a timeline that collapsed',
    backstory:
      'A scout chassis from a future that ended; with nothing left to scout, it shadows the bowl\'s boldest dinos instead.',
    ability: {
      label: 'Daredevil Drive',
      desc: 'Bold, fiery dinos take to you faster.',
      appeal: { bravery: 1, energy: 0.5 },
    },
  },
  {
    id: 'lumen',
    name: 'LUMEN-3 "Lux"',
    era: 'the deep-future archives',
    backstory:
      'A cataloguing unit that escaped the archives to study living minds firsthand; it favours the curious ones.',
    ability: {
      label: 'Scholar Lens',
      desc: 'Curious, inquisitive dinos open up to you faster.',
      appeal: { curiosity: 1, bravery: 0.3 },
    },
  },
];

export const DEFAULT_KEEPER_ID = KEEPERS[0].id;

export function keeperById(id: string | undefined): Keeper {
  return KEEPERS.find((k) => k.id === id) ?? KEEPERS[0];
}

/** The unit designation alone (the code before the nickname): `'AETHER-1 "Aki"'` → `'AETHER-1'`. */
export function designationOf(keeper: Keeper): string {
  return keeper.name.split('"')[0].trim();
}

/** Fit of an observer for a dino's personality: Σ weight · (trait centered to [-1,1]). No traits → 0. */
export function keeperFit(keeper: Keeper, traits?: Personality): number {
  if (!traits) return 0;
  let score = 0;
  for (const key of Object.keys(keeper.ability.appeal) as (keyof Personality)[]) {
    const weight = keeper.ability.appeal[key] ?? 0;
    score += weight * (traits[key] * 2 - 1);
  }
  return score;
}

/**
 * Bonus affinity points the chosen observer adds to one player→dino interaction. A perk, not a
 * punishment: it only ever *helps* (0..+2), so picking an observer can't make a dino like you less —
 * it just decides which dinos you bond with fastest.
 */
export function keeperBonus(keeper: Keeper, traits?: Personality): number {
  const fit = keeperFit(keeper, traits);
  if (fit >= 0.8) return 2;
  if (fit >= 0.3) return 1;
  return 0;
}
