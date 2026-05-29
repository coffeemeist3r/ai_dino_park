/**
 * Day/night tint — maps in-game time to a screen overlay color + alpha.
 *
 * Pure TypeScript: no Phaser import, so it runs in Node for tests
 * (same shape as clock.ts). WorldScene reads tintFor() each tick and
 * paints one full-screen rectangle.
 */

import type { GameTime } from './clock';

export interface Tint {
  color: number; // 0xRRGGBB
  alpha: number; // 0..1
}

interface Keyframe {
  min: number; // minutes since midnight, 0..1440
  color: number;
  alpha: number;
}

/**
 * Sky over a full day. Midnight blue, warm dawn/dusk, clear noon.
 * Colors are deliberately channel-unambiguous: night is blue-dominant,
 * dawn/dusk are red-dominant — keeps QA's channel checks robust.
 * The 1440 endpoint duplicates the 0 endpoint so the midnight wrap
 * lerps continuously instead of popping.
 */
const KEYFRAMES: Keyframe[] = [
  { min: 0, color: 0x0a1a40, alpha: 0.55 }, // 00:00 night
  { min: 300, color: 0x0a1a40, alpha: 0.52 }, // 05:00 night, easing
  { min: 420, color: 0xd8782a, alpha: 0.3 }, // 07:00 dawn (warm)
  { min: 480, color: 0x000000, alpha: 0.0 }, // 08:00 full day (clear)
  { min: 1020, color: 0x000000, alpha: 0.0 }, // 17:00 full day (clear)
  { min: 1140, color: 0xd85a20, alpha: 0.3 }, // 19:00 dusk (warm)
  { min: 1260, color: 0x0a1a40, alpha: 0.52 }, // 21:00 night
  { min: 1440, color: 0x0a1a40, alpha: 0.55 }, // 24:00 == 00:00 wrap
];

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}

function lerpColor(a: number, b: number, f: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(lerp(ar, br, f));
  const g = Math.round(lerp(ag, bg, f));
  const bl = Math.round(lerp(ab, bb, f));
  return (r << 16) | (g << 8) | bl;
}

export function tintFor(t: GameTime): Tint {
  const m = ((t.hour * 60 + t.minute) % 1440 + 1440) % 1440;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const k0 = KEYFRAMES[i];
    const k1 = KEYFRAMES[i + 1];
    if (m >= k0.min && m <= k1.min) {
      const span = k1.min - k0.min;
      const f = span === 0 ? 0 : (m - k0.min) / span;
      return { color: lerpColor(k0.color, k1.color, f), alpha: lerp(k0.alpha, k1.alpha, f) };
    }
  }
  // Unreachable: m is always within [0, 1440] and keyframes span that range.
  return { color: KEYFRAMES[0].color, alpha: KEYFRAMES[0].alpha };
}

export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk';

export function dayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'night';
}
