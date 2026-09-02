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

/**
 * The night shift (BACKLOG-524).
 *
 * BACKLOG-109 split the cast into day-dinos and night-owls and **no system in the park knew the owls
 * existed.** A ground rolled its resource because somebody *lived* there — `residentZones()` is
 * `occupiedZones()`, pure membership — so the Fernreach yielded at four in the morning at exactly the rate
 * it yielded at noon, and the park's whole daytime workforce could have been face-down in the dirt without
 * the stockpiles noticing. Two cycles of chronotype work that were true, tested, load-bearing, and changed
 * nothing you could watch: CHARTER v7's defect, one layer along from where v7 found it.
 *
 * These two reads are the seam. They stay pure and parameterised on the hour, like everything else here —
 * nothing is persisted, and a waking count is re-derived on every load exactly as the chronotype it comes
 * from is.
 */
export interface Resident {
  name: string;
  zone: string;
  traits: Personality;
}

/** Is this resident up right now? The one place the two reads below agree about what "awake" means. */
function isWaking(r: Resident, hour: number, season?: Season): boolean {
  return !atRest(hour, chronotypeOf(r.traits), season);
}

/**
 * How many residents of each ground are awake. **Every ground in `rows` gets a key, zeros included** — the
 * caller has to be able to tell "its cast is asleep" from "nobody lives here", and those are different
 * grounds with different reasons for producing nothing.
 */
export function wakingIn(rows: readonly Resident[], hour: number, season?: Season): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.zone] = (out[r.zone] ?? 0) + (isWaking(r, hour, season) ? 1 : 0);
  return out;
}

/**
 * Whoever is up while their ground is down — the one thing somebody does *because* they are the only one
 * awake. Sorted, so the cadence that sounds this beat is order-stable.
 *
 * **A solo resident is never a watcher.** A ground with one dino awake on it has nobody to keep watch over,
 * and calling that the night shift would make the beat fire on three of the park's five grounds every hour
 * of the day. The read is about a ground with a sleeping cast and one pair of open eyes in it.
 *
 * Deliberately **not owl-exclusive**. The obvious design is "the owl keeps the watch" and it is wrong: it
 * makes the beat a property of a trait rather than of an hour, and it goes dark for the eight hours a day
 * the owl is the one asleep. Owls get it at night because that is when it is true of them, and a day-dino
 * gets it at eight in the morning because its neighbour is an owl.
 */
export function watchersIn(rows: readonly Resident[], hour: number, season?: Season): string[] {
  const byZone: Record<string, Resident[]> = {};
  for (const r of rows) (byZone[r.zone] ??= []).push(r);
  const out: string[] = [];
  for (const group of Object.values(byZone)) {
    if (group.length < 2) continue;
    const awake = group.filter((r) => isWaking(r, hour, season));
    if (awake.length === 1) out.push(awake[0].name);
  }
  return out.sort();
}

/**
 * Where a dino stands in its own day (BACKLOG-110 / -279) — the hour, in the voice.
 *
 * `NPCContext.timeOfDay` has been set on every greet since the clock existed and read by exactly one
 * consumer: the WebLLM prompt preamble. `cannedReply` — the stub brain, *and* the WebLLM brain's own
 * fallback while it loads or errors — composes nine asides and knows every fact about a dino except what
 * time it is. The CHARTER's Living-minds line says the model is enrichment on top and the deterministic
 * rules are the floor; here the hour existed only on top.
 *
 * The register keys off **the dino's own window**, not the park's clock-phase, because the hour alone says
 * the same thing to all ten. At 08:00 on a fresh save four Bowl dinos are three hours into a day that
 * started at five and Rex is five hours from the end of a sleep that started at five: same hour, opposite
 * standing. That is the read.
 *
 * **No hour constant appears below.** The quarters come out of `restWindow`, so a spring day-dino reads
 * `fresh` at 08:00 because its waking span runs 05:00–21:00 and not because 08:00 was picked — which is the
 * corollary under CHARTER v7's reachability bar obeyed rather than dodged. Move `SEASON_HUDDLE` or
 * `OWL_SHIFT` and these boundaries move with them.
 */
export type DayStanding = 'roused' | 'fresh' | 'waning' | 'nightlong';

export function dayStanding(hour: number, c: Chronotype, season?: Season): DayStanding | null {
  if (atRest(hour, c, season)) return 'roused';
  const { start, end } = restWindow(c, season);
  // The waking span is the rest window's complement: awake from `end` round to `start`.
  const span = (((start - end) % 24) + 24) % 24;
  if (span === 0) return null; // a window that never opens — a guard, not a case the seasons reach
  const awakeFor = (((hour - end) % 24) + 24) % 24;
  const quarter = span / 4;
  // Most specific truth first: being up at midnight beats being late in your day, and both can hold.
  if (dayPhase(hour) === 'night') return 'nightlong';
  if (awakeFor < quarter) return 'fresh';
  if (awakeFor >= span - quarter) return 'waning';
  return null; // mid-span, park lit — the aside stays quiet, so this is a tell and not a tic
}
