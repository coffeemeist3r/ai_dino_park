/**
 * Spring thaw relief (BACKLOG-215) — the cold arc's kind ending. Cycle 179 made a dino sleep cold
 * and shiver; 208 gave the one nobody warmed its harder note. This is the reward for having toughed
 * it out: when the year finally turns *out* of winter (159), a dino that carries a first-hand
 * cold-night memory gets a one-off "made it through the winter" lift + a relieved line, and the cruel
 * season's ending becomes its own small celebration. The last unchecked Milestone 8 lore arc.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene fires this on the winter→spring turn beat.
 */

import { isShareable } from '../social/gossip';
import { recall, type MemoryStore } from '../ai/memory';

/**
 * The tell that a remembered event is a first-hand cold night. Both `coldMemory()` ("shivered through
 * a cold night…") and `neglectMemory()` ("shivered all morning; nobody came") begin with it; the
 * keeper-warmed memory ("the keeper warmed me after a cold night", 184) does not contain it — so a
 * rescued dino, who did not tough the cold out alone, is correctly excluded from the relief.
 */
export const THAW_TOKEN = 'shivered';

/** The one-off friendship lift a survivor warms to the keeper by — modest, a spring in the step. */
export const THAW_LIFT = 4;

/**
 * Did `name` tough out the winter — does it carry a *first-hand* cold-night memory? `isShareable`
 * drops rumor-marked hearsay, so a dino merely carrying word of *another's* cold night doesn't count;
 * only a dino that shivered itself earns the thaw. Mirrors `recovered()` in cold.ts (same read, warm
 * token → cold token).
 */
export function thawedThroughWinter(store: MemoryStore, name: string): boolean {
  return recall(store, name).some((e) => isShareable(e) && e.includes(THAW_TOKEN));
}

/** The relieved bubble floated over a survivor at the thaw (a register distinct from 🥶/😊/🫂). */
export function thawLine(name: string): string {
  return `🌱 ${name} made it through the winter`;
}

/** The bright memory a survivor keeps — can colour its next greeting the way the cold memory did. */
export function thawMemory(): string {
  return 'made it through the winter 🌱';
}
