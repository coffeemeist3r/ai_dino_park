/**
 * Dino activity readout (BACKLOG-295) — what each dino is *doing now*, surfaced as a glyph.
 *
 * Pure TypeScript (no Phaser, no WebLLM): the precedence lives here so WorldScene's per-dino loop just
 * hands over the realized flags. The order mirrors the `forceStep` movement ladder — the thing a dino
 * actually prioritizes that step is the thing the player sees above its head.
 */

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
