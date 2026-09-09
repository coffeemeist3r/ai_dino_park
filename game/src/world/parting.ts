/**
 * The goodbye glance (BACKLOG-119) — the bookend to the homecoming.
 *
 * Milestone 18 spent five arcs teaching this park to say something about the keeper's absence,
 * and every one of them fires on the **return**: what each dino made of the gap, what it cost a
 * pair, where you can re-read it, how many days running you have come back. This is the one on
 * the other side of the door. Nothing in this park has ever reacted to the player *leaving*.
 *
 * ## Where it fires, and why that is the whole item
 *
 * BACKLOG-119's own text has said since cycle 30 that the trigger is the tab going hidden. It
 * cannot be. That is precisely the one moment in this feature at which the canvas, by
 * definition, is not being looked at — a glance drawn to a hidden tab is CHARTER v7's failure
 * mode in its purest form, and it sat in the item's text for a hundred and twenty-five cycles
 * without anyone reading it out loud. The glance fires on `departure.ts`'s **`leaving`** stage —
 * focus lost, canvas still painting — and `gone` draws nothing, because there is nothing to
 * draw to.
 *
 * ## Why the wave and not the eyes
 *
 * The item asks for 👀. That glyph has been `VIGIL_GLYPH` since cycle 149, and 👁 has been
 * `ROUSE_GLYPH` since 109, so two of the five existing hour-marks are already eyes and a third
 * would make the family unreadable at 12px — the cycle-154 Artist's argument about the mallet,
 * applied before a pixel is drawn. The replacement is not merely a free slot: the five existing
 * marks are all facts about a dino's **interior** (asleep, up at night, waiting, mending,
 * thinking of you), and this is the only one **addressed to the player**. So it borrows the one
 * symbol this park already uses to address the player — BACKLOG-112's welcome-back wave — told
 * from the other end. A living bookend, which is what the item asked to be.
 *
 * Pure (no Phaser, no WebLLM). Who is in view and who is asleep are the scene's facts and arrive
 * as `present`; this module only decides which of them looks up.
 */

import { heartsFromPoints, type Friendship } from '../social/friendship';
import { topBy } from './homecoming';
import { SESSION_MIN_MS } from './departure';

/** The art key for the mark a dino wears as it throws the look. Renders as the glyph until drawn. */
export const GLANCE_ART_KEY = 'glance';

/** BACKLOG-119's glyph — see the header on why this is a wave and not the eyes the item asked for. */
export const GLANCE_GLYPH = '👋';

/** How long the look holds before the bowl goes quiet. A glance, not a stare. */
export const GLANCE_MS = 2500;

export interface Parting {
  /** the dino that looks up — your closest, among those actually present and awake. */
  name: string;
  /** that dino's heart level (0..10), which grades the line. */
  hearts: number;
  /** the floating goodbye (contains the name + the wave), warmth graded by hearts. */
  line: string;
}

/**
 * Graded on the same three tiers and the same thresholds as `homecoming.ts`'s `spokenLine`, so
 * the two ends of a session are measured against one scale. A dino you barely know is not sorry
 * to see you go; it just notices.
 */
function partingLine(name: string, hearts: number): string {
  if (hearts >= 7) return `${name}: Don't be long. ${GLANCE_GLYPH}`;
  if (hearts >= 4) return `${name}: See you soon! ${GLANCE_GLYPH}`;
  return `${name}: Oh. Going, then. ${GLANCE_GLYPH}`;
}

/**
 * Who throws the look, if anyone.
 *
 * `present` is the scene's list of dinos that are both in view and awake — the sleeping-dino
 * exclusion lives there rather than here, because who is asleep is a fact about the hour and the
 * chronotype, which is the scene's to know and not this module's to re-derive.
 *
 * Returns `null` for a session too short to have been a visit, for an empty park, and for a park
 * whose cast has no friendship yet — a bowl you have never spoken to does not wave you off, and
 * that silence is correct rather than a gap.
 */
export function partingGlance(
  friendship: Friendship,
  present: string[],
  sessionMs: number,
): Parting | null {
  if (sessionMs < SESSION_MIN_MS) return null;
  if (!present.length) return null;
  const here: Friendship = {};
  for (const name of present) {
    const points = friendship[name];
    if (points !== undefined) here[name] = points;
  }
  const best = topBy(here);
  if (!best) return null;
  const hearts = heartsFromPoints(best.points);
  return { name: best.name, hearts, line: partingLine(best.name, hearts) };
}
