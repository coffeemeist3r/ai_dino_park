/**
 * Dino activity readout (BACKLOG-295) — what each dino is *doing now*, surfaced as a glyph.
 *
 * Pure TypeScript (no Phaser, no WebLLM): the precedence lives here so WorldScene's per-dino loop just
 * hands over the realized flags. The order mirrors the `forceStep` movement ladder — the thing a dino
 * actually prioritizes that step is the thing the player sees above its head.
 */

import { hashSeed } from '../ai/personality';

export type Activity =
  | 'gazing'
  | 'inspecting'
  | 'responding'
  | 'stalking'
  | 'fleeing'
  | 'feeding'
  | 'huddling'
  | 'gathering'
  | 'socializing'
  | 'wandering';

export const ACTIVITY_GLYPH: Record<Activity, string> = {
  gazing: '✨',
  inspecting: '👀',
  responding: '🆘',
  stalking: '🎯', // BACKLOG-367: a hungry carnivore closing on prey
  fleeing: '💨', // BACKLOG-367: the hunted herbivore bolting
  feeding: '🍖',
  huddling: '💤',
  gathering: '🪵',
  socializing: '💬',
  wandering: '🚶',
};

/**
 * Caught in the act (BACKLOG-300) — what the keeper interrupted, in the dino's own greeting.
 *
 * 295 resolves one of these ten every step and exactly one thing reads it: the glyph over the dino's head.
 * Walk up to a dino face-down in a food drop, curled in a huddle, or hauling a stone across the ground,
 * press E, and the hello that came back was the hello it would have given standing still in an empty field.
 * The one axis of this park that differs per dino *and* per minute was invisible in the one moment the
 * player is actually talking to it.
 *
 * Register borrowed from `ticAside` (423): the *physical business of stopping*, not a status report. Two
 * phrasings apiece, picked by `hashSeed(name)`, so the same dino always words it the same way — a tell you
 * can learn — while two dinos caught at the same thing need not sound alike.
 *
 * `wandering` is deliberately empty, and that is load-bearing: a dino that was doing nothing in particular
 * greets exactly as it did before this shipped, byte for byte, so the beat *means* something when it fires.
 */
export const ACTIVITY_ASIDES: Record<Activity, readonly string[]> = {
  gazing: ['drags its eyes down off the sky', 'blinks like it forgot the ground was there'],
  inspecting: ['abandons whatever it was nosing at', 'straightens up from something half-examined'],
  responding: ['is halfway to somewhere urgent and clearly torn about it', 'keeps glancing back the way it was headed'],
  stalking: ['unwinds out of a crouch it would rather you had not seen', 'gives up the line it was creeping along'],
  fleeing: ['is still breathing hard from getting out of somewhere', 'checks over its shoulder twice before it settles'],
  feeding: ['swallows first, then talks', 'has a cheek still full and no shame about it'],
  huddling: ['peels itself out of the warm pile', 'stays curled and answers from where it is'],
  gathering: ['sets down what it was carrying, carefully', 'shifts a load to its other side to look at you'],
  socializing: ['breaks off mid-sentence with somebody else', 'looks back once at the conversation you interrupted'],
  wandering: [],
};

/**
 * The clause for what a dino was doing when the keeper walked up, or null when there is nothing to name.
 * Deterministic and model-free — this ships to every device, and the prompt colour rides on top where a
 * model happens to be loaded (the cycle-140 finding: a beat that only exists behind an optional download
 * is not a beat).
 */
export function activityAside(activity: Activity, name: string): string | null {
  const variants = ACTIVITY_ASIDES[activity];
  if (!variants || variants.length === 0) return null;
  return variants[hashSeed(name) % variants.length];
}

export interface ActivityFlags {
  gazing: boolean;
  inspecting: boolean;
  responding: boolean;
  feeding: boolean;
  huddling: boolean;
  gathering: boolean;
  socializing: boolean;
}

/** Resolve the dino's current activity from the realized flags — first true in priority order wins. */
export function dinoActivity(f: ActivityFlags): Activity {
  if (f.gazing) return 'gazing';
  if (f.inspecting) return 'inspecting';
  if (f.responding) return 'responding';
  if (f.feeding) return 'feeding';
  if (f.huddling) return 'huddling';
  if (f.gathering) return 'gathering';
  if (f.socializing) return 'socializing';
  return 'wandering';
}
