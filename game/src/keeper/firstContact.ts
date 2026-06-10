/**
 * First-contact inspection (BACKLOG-161) — the bowl reacts to who you chose. The moment the
 * keeper *changes* (a real pick, not a boot restore), the dino whose temperament most resonates
 * with the new observer crosses the bowl for a long look. Nobody resonates → nobody comes,
 * which is its own kind of telling.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene arms the beat and walks the inspector.
 */

import type { Personality } from '../ai/personality';
import { keeperFit, type Keeper } from './keepers';

/** World steps of curiosity before the inspector loses interest (a cross-bowl walk is ~19). */
export const INSPECT_TTL = 24;

export interface CastMember {
  name: string;
  traits: Personality;
}

/**
 * Who comes to size up the new observer: the cast's highest keeperFit, strictly positive,
 * alphabetical tie-break (the comforter convention). No positive fit → null.
 */
export function inspector(keeper: Keeper, cast: ReadonlyArray<CastMember>): string | null {
  let best: { name: string; fit: number } | null = null;
  for (const member of cast) {
    const fit = keeperFit(keeper, member.traits);
    if (!best || fit > best.fit || (fit === best.fit && member.name < best.name)) {
      best = { name: member.name, fit };
    }
  }
  return best && best.fit > 0 ? best.name : null;
}

/** The floating beat over the inspector when it reaches the new watcher. */
export function inspectLine(name: string): string {
  return `${name}: *comes close, looks the new watcher up and down* 👀`;
}

/** The memory the inspector keeps; rides the existing persisted memory store. */
export function inspectMemory(keeperName: string): string {
  return `went to the glass for a long look at ${keeperName}`;
}
