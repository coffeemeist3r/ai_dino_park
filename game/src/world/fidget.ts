/**
 * Idle fidgets (BACKLOG-298) — even doing nothing reads as character.
 *
 * The activity readout (BACKLOG-295) draws every goalless dino with the same generic 🚶, so the
 * bowl's resting state is five identical wanderers. This maps a dino's personality to a *signature
 * idle quirk* — keyed to its most-pronounced trait — that WorldScene shows in place of 🚶 while it
 * wanders. Deterministic from the name-seeded traits (010), so each founder idles in its own way.
 *
 * Pure TypeScript (no Phaser, no WebLLM): takes a structural `Personality`. WorldScene only swaps the
 * rendered glyph; the underlying `wandering` activity (and the 295 `__activity` hook) is untouched.
 */

import { AXES, type Personality } from '../ai/personality';

export interface Quirk {
  glyph: string;
  label: string;
}

/**
 * One quirk per axis pole. Glyphs are deliberately disjoint from ACTIVITY_GLYPH (✨👀🆘🍖💤🪵💬🚶)
 * so an idle quirk can never be mistaken for a 295 state glyph.
 */
export const IDLE_QUIRKS: Record<keyof Personality, { low: Quirk; high: Quirk }> = {
  curiosity: { high: { glyph: '👆', label: 'pokes at the glass' }, low: { glyph: '🧍', label: 'stands warily' } },
  sociability: { high: { glyph: '💭', label: 'looks for company' }, low: { glyph: '🌀', label: 'keeps to itself' } },
  energy: { high: { glyph: '🤸', label: 'bounces about' }, low: { glyph: '😪', label: 'dozes on its feet' } },
  agreeableness: { high: { glyph: '🎵', label: 'hums to itself' }, low: { glyph: '🙄', label: 'grumbles' } },
  bravery: { high: { glyph: '🐾', label: 'paces' }, low: { glyph: '🫣', label: 'peeks around timidly' } },
};

/**
 * A dino's signature idle quirk: the quirk of its most-pronounced trait — the axis furthest from
 * neutral (0.5). Ties resolve by AXES order (stable). The high pole when the value sits at/above 0.5,
 * else the low pole.
 */
export function fidget(p: Personality): Quirk {
  let bestAxis: keyof Personality = AXES[0].key;
  let bestDev = -1;
  for (const axis of AXES) {
    const dev = Math.abs(p[axis.key] - 0.5);
    if (dev > bestDev) {
      bestDev = dev;
      bestAxis = axis.key;
    }
  }
  const pole = IDLE_QUIRKS[bestAxis];
  return p[bestAxis] >= 0.5 ? pole.high : pole.low;
}
