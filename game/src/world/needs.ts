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
