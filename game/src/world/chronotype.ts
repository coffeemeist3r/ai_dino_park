/**
 * Chronotype (BACKLOG-109) — not everybody in the park keeps the same hours.
 *
 * The park has had a 24-minute in-game day since BACKLOG-493 and has never once spent it: five dinos woke
 * together and five slept together, because the schedule belonged to the clock rather than to any of them.
 * That is the sameness the CHARTER's Living-minds line calls a defect, sitting on the largest reachable
 * surface the studio had built and not used.
 *
 * A chronotype decides *which window* a dino rests in, never whether it rests — total sleep is unchanged
 * and the season table still shapes both halves of the cast. A day-dino's window is exactly
 * `SEASON_HUDDLE`'s, so day-dinos behave as they always have; a night-owl's is the same window shifted
 * eight hours, so it is down through the morning and up through the night.
 *
 * Pure TypeScript: no Phaser, no clock, no randomness. The hour is a parameter and the traits are
 * name-seeded (`ai/personality.ts`), so a chronotype is re-derived on every load and nothing about it is
 * written to the save.
 */

import type { Personality } from '../ai/personality';
import type { Season } from './seasons';
import { SEASON_HUDDLE } from './huddle';
import { dayPhase } from './dayNight';

export type Chronotype = 'day' | 'owl';

/**
 * The bar, and the weights behind it.
 *
 * Owlishness is mostly *curiosity* and partly *calm*: the dino that stays up is the one with something it
 * wants to look at and no great hurry about the morning. The alternative considered was a bare
 * `curiosity > energy`, and it was rejected for a measurable reason — it puts Mossback within 0.001 of the
 * line, so a single trait tweak anywhere would flip a founding dino's schedule. These weights clear the
 * bar by ~0.05 on both sides for every one of the ten roster names.
 */
export const OWL_CURIOSITY_WEIGHT = 0.65;
export const OWL_CALM_WEIGHT = 0.35;
export const OWL_BAR = 0.5;

/** How much this dino is a creature of the small hours, 0..1. */
export function owlishness(p: Personality): number {
  return p.curiosity * OWL_CURIOSITY_WEIGHT + (1 - p.energy) * OWL_CALM_WEIGHT;
}

export function chronotypeOf(p: Personality): Chronotype {
  return owlishness(p) >= OWL_BAR ? 'owl' : 'day';
}

/**
 * How far an owl's window sits from a day-dino's. Eight hours rather than a clean twelve on purpose: a
 * twelve-hour flip would make an owl's night the exact photographic negative of a day-dino's, and the two
 * halves of the cast would never be awake at the same time — which is a park with two shifts and no
 * society, not a park with night-owls in it. At eight the windows overlap at both ends.
 */
export const OWL_SHIFT = 8;

/** The legacy night window (`dayPhase(h) === 'night'`), as a pair, for the season-omitted path. */
const LEGACY_WINDOW = { start: 21, end: 5 };

/**
 * The hours this chronotype is down. A day-dino gets the season's own huddle window verbatim, so nothing
 * about a day-dino's schedule has moved; omitting the season keeps `inHuddleWindow`'s legacy night phase.
 */
export function restWindow(c: Chronotype, season?: Season): { start: number; end: number } {
  const base = season ? SEASON_HUDDLE[season] : LEGACY_WINDOW;
  if (c === 'day') return { start: base.start, end: base.end };
  return { start: (base.start + OWL_SHIFT) % 24, end: (base.end + OWL_SHIFT) % 24 };
}

/**
 * Is this dino down at this hour? The wrapping test is `inHuddleWindow`'s, deliberately the same idiom in
 * the same shape — a window that crosses midnight is the normal case here, not the exception.
 */
export function atRest(hour: number, c: Chronotype, season?: Season): boolean {
  const { start, end } = restWindow(c, season);
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

/**
 * Is this dino up while the park is dark — the read that, by construction, only an owl ever passes. This
 * is the "only thing moving" tell, and the host BACKLOG-520 draws its `rouse` rig against.
 */
export function awakeAtNight(hour: number, c: Chronotype, season?: Season): boolean {
  return dayPhase(hour) === 'night' && !atRest(hour, c, season);
}

/**
 * The two behaviour glyphs, the way every other tell in this park ships: a glyph now, a rig when the Artist
 * gets to it (BACKLOG-520 is queued with this item named as its host). They are mutually exclusive by
 * construction — a dino cannot be resting and awake-at-night in the same frame — so they share one slot.
 */
export const DOZE_GLYPH = '💤';
export const ROUSE_GLYPH = '👁';

/** The `PROP_RIGS` keys BACKLOG-520 draws these two against. Named here, beside the glyphs they replace,
 *  so the world and the reachability register read the same two strings from one place. */
export const DOZE_ART_KEY = 'doze';
export const ROUSE_ART_KEY = 'rouse';

/** The collection-book standing — legible on frame one, without waiting for any particular hour. */
export function chronotypeLine(c: Chronotype): string {
  return c === 'owl' ? 'keeps late hours' : 'up with the sun';
}
