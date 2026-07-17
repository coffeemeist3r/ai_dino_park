/**
 * Need-drive spine (BACKLOG-371) — the bowl gets hunger and thirst.
 *
 * For twenty cycles a dino never wanted anything on its own clock: food only mattered when the keeper
 * dropped it. This gives each dino two trait-shaped drives that build over realtime and resolve through
 * actions that already exist — eat at the hatch → hunger 0; reach the pond water → thirst 0 — surfaced
 * as a gentle 🍖/💧 tell over a dino in want.
 *
 * Deliberately **deathless**: a need is a *tell* this cycle, not a behavior driver. No decay-to-death, no
 * spiral, no wander-pull (that follow-up is 372; mortality is a CHARTER call routed to the operator). The
 * answer to the structural half of the operator's hunger/thirst nudge, split deathless per IDEABOX.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable. WorldScene owns the per-step tick, the marks,
 * the eat/drink resets, and the additive save field.
 */

import type { Personality } from '../ai/personality';

export interface Need {
  hunger: number; // 0 sated .. 1 starving
  thirst: number; // 0 sated .. 1 parched
}

export type Needs = Record<string, Need>;
export type NeedKind = 'hunger' | 'thirst';

/** At or above this, a need is *pressing* — it shows its mark. */
export const NEED_THRESHOLD = 0.6;

/**
 * Starving (BACKLOG-444) — the bar at which a zone's banked food (446) is spent on a resident. Deliberately
 * well above NEED_THRESHOLD: the 0.6–0.9 band is where the whole of Milestone 5 lives — a dino that wears
 * the 🍖, leans toward the hatch (436), and wakes hungry at dawn (376) *without* the pantry bailing it out.
 * The store is the last resort, not the default. Still deathless: nothing happens to a dino left starving
 * except that it stays starving (mortality is a CHARTER call, routed to the operator).
 */
export const STARVING = 0.9;

/** Is this dino starving — hungry enough that its zone's stores would be spent on it (BACKLOG-444)? */
export function isStarving(n: Need | undefined): boolean {
  return (n?.hunger ?? 0) >= STARVING;
}

/** Per-`forceStep` build rates. Thirst is slower than hunger on purpose: hunger is the common,
 *  keeper-quenched need; thirst (only quenched at the grove pond) stays the rarer 💧. */
export const HUNGER_RATE = 0.01;
export const THIRST_RATE = 0.005;

export const NEED_GLYPH: Record<NeedKind, string> = { hunger: '🍖', thirst: '💧' };

/** Energy-scaled build rate (a higher-energy dino burns through it a little faster): 0.6×..1.4× the base. */
function scaled(base: number, traits?: Personality): number {
  return base * (0.6 + 0.8 * (traits?.energy ?? 0.5));
}
export const hungerRate = (traits?: Personality): number => scaled(HUNGER_RATE, traits);
export const thirstRate = (traits?: Personality): number => scaled(THIRST_RATE, traits);

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Advance every listed dino's needs by `steps` forceSteps at its trait-shaped rate (clamped ≤ 1).
 * Pure: returns a new map, never deletes a dino (deathless by construction). A dino absent from `needs`
 * starts fresh at {0,0}.
 */
export function advanceNeeds(
  needs: Needs,
  entries: ReadonlyArray<{ name: string; traits?: Personality }>,
  steps = 1,
): Needs {
  const next: Needs = { ...needs };
  for (const { name, traits } of entries) {
    const cur = next[name] ?? { hunger: 0, thirst: 0 };
    next[name] = {
      hunger: clamp01(cur.hunger + hungerRate(traits) * steps),
      thirst: clamp01(cur.thirst + thirstRate(traits) * steps),
    };
  }
  return next;
}

/** The more pressing of a dino's needs, or null if neither is over the threshold. Ties go to thirst. */
export function pressingNeed(n: Need | undefined): NeedKind | null {
  if (!n) return null;
  const overH = n.hunger >= NEED_THRESHOLD;
  const overT = n.thirst >= NEED_THRESHOLD;
  if (!overH && !overT) return null;
  if (overT && n.thirst >= n.hunger) return 'thirst';
  return overH ? 'hunger' : 'thirst';
}

/** Reset one of a dino's needs to 0 (eating sates hunger; drinking sates thirst). Returns a new map. */
export function satisfy(needs: Needs, name: string, which: NeedKind): Needs {
  const cur = needs[name] ?? { hunger: 0, thirst: 0 };
  return { ...needs, [name]: { ...cur, [which]: 0 } };
}

/**
 * Need pulls the body (BACKLOG-436) — the deferred behavior half of the need-drive. A pressing need leans a
 * dino's wander toward relief (WorldScene supplies the hatch/pond target), but only as a *lean, not a
 * compulsion*: this gate fires on ~`NEED_PULL_CHANCE` of steps, so a hungry dino drifts toward the hatch
 * without being locked to a beeline, and every existing ritual above it in the wander ladder still wins.
 * Mirror of `huntSucceeds` — pure so the rate is unit-pinned and callers can force the outcome.
 */
export const NEED_PULL_CHANCE = 0.6;

export function needSeeks(roll: number, chance = NEED_PULL_CHANCE): boolean {
  return roll < chance;
}
