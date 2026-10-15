/**
 * The molt (BACKLOG-023) — the moment a youngster leaves youth (Milestone 30, lore arc 1).
 *
 * It comes out shaped by what its youth held: a grudge hardens it, a close friend softens it, and a youth with
 * neither leaves it bolder. A grudge outranks a friend — it is the louder thing a young dino carries. Pure.
 */

import type { Personality } from '../ai/personality';
import { RIVAL_BAR } from '../social/grudges';
import { CLOSE_BOND } from '../social/closest';

export type MoltKind = 'softer' | 'harder' | 'bolder';

export const MOLT_NUDGE = 0.15;

/** The shed skin left on the tile (BACKLOG-603 draws it; 🐚 until then). */
export const MOLT_ART_KEY = 'molt';
export const MOLT_GLYPH = '🐚';

export function moltKind(o: { friendPts: number; grudgePts: number }): MoltKind {
  if (o.grudgePts >= RIVAL_BAR) return 'harder';
  if (o.friendPts >= CLOSE_BOND) return 'softer';
  return 'bolder';
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function moltTraits(t: Personality, kind: MoltKind): Personality {
  const out = { ...t };
  if (kind === 'harder') out.agreeableness = clamp01(t.agreeableness - MOLT_NUDGE);
  else if (kind === 'softer') out.agreeableness = clamp01(t.agreeableness + MOLT_NUDGE);
  else out.bravery = clamp01(t.bravery + MOLT_NUDGE);
  return out;
}

/** What it says as it steps out of its skin. `who` is the friend (softer) or the rival (harder). */
export function moltLine(kind: MoltKind, who?: string): string {
  if (kind === 'softer') return `${MOLT_GLYPH} All grown! I'm keeping ${who} close.`;
  if (kind === 'harder') return `${MOLT_GLYPH} Grown. And I haven't forgotten ${who}.`;
  return `${MOLT_GLYPH} Look at me — all grown up!`;
}

export function moltTicker(name: string, kind: MoltKind): string {
  return `${MOLT_GLYPH} ${name} molted — came out ${kind}`;
}

export function moltMemory(kind: MoltKind): string {
  return `grew up — came out ${kind}`;
}
