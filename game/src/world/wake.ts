/**
 * Woke hungry (BACKLOG-376) — the need-drive gets a moment.
 *
 * Hunger has existed since 371 and never once had a *beat*: it's a 🍖 that fades in when a float crosses
 * NEED_THRESHOLD, unattached to anything you could catch. Dawn is the one boundary the whole cast observes
 * together (the chorus, 192), and until now that morning was uniform — everyone chirped, whatever kind of
 * night they'd had. This breaks the uniformity with the need Milestone 5 is about: the dinos that went to
 * bed hungry wake differently, and because the hunger rate is energy-scaled (`needs.ts` `scaled`), *which*
 * dinos those are is a read on temperament rather than a dice roll.
 *
 * Pure (no Phaser, no WebLLM — the shaded line is deterministic procedural, never an LLM call): the verdict
 * and the wording are decided here and unit-tested. WorldScene owns the dawn hook (the tail of
 * `checkDawnChorus`, inheriting its once-per-day + live-only guards), the 🍖 flash, and the ticker.
 *
 * A read, not an actuator: 436 already leans a hungry dino toward the hatch and 444 owns feeding it.
 */

import type { Personality } from '../ai/personality';
import { NEED_THRESHOLD, type Need } from './needs';

/**
 * Did this dino wake hungry — is its hunger past the pressing bar at the dawn boundary?
 *
 * Reads `hunger` directly rather than `pressingNeed()` on purpose: pressingNeed answers "the *more*
 * pressing need" and returns 'thirst' on a tie or when thirst runs higher, which would silently rob a
 * hungry-and-thirstier dino of its morning. Hunger is hunger, whatever else the dino also wants.
 */
export function wokeHungry(n: Need | undefined): boolean {
  return (n?.hunger ?? 0) >= NEED_THRESHOLD;
}

/**
 * The ticker line for a dino that woke hungry, shaded by temperament — a prickly dino wakes irritable, a
 * high-energy one impatient, everyone else plaintive. The same dawn reads differently per dino, which is
 * the point (CHARTER "Living minds"). Deterministic and total: a dino with no traits gets the neutral tail.
 */
export function wakeHungryLine(name: string, traits?: Personality): string {
  const tail =
    traits && traits.agreeableness < 0.35
      ? ' — and in no mood about it'
      : traits && traits.energy > 0.65
        ? ' — already casting about for the hatch'
        : ' — and looked to the hatch';
  return `🍖 ${name} woke hungry${tail}`;
}

/** The memory a dino that woke hungry keeps; it can colour its next greeting through the usual channel. */
export function wakeHungryMemory(): string {
  return 'you woke hungry — the night was long and nothing came';
}
