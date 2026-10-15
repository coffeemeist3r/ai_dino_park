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

/** Who walks over to a molt (BACKLOG-604), and in what capacity — which is also how it speaks (BACKLOG-605). */
export type WitnessRole = 'parent' | 'friend' | 'rival';

export interface Witness {
  who: string;
  role: WitnessRole;
}

/** A walk to a molt not finished in this many world steps is dropped. */
export const MOLT_VISIT_STEPS = 30;

/** The scrap of shell a youngster wears until it molts (BACKLOG-606 draws it; nothing shows until then). */
export const SHELLCAP_ART_KEY = 'shellcap';

/**
 * Who comes to see it grow up: its parents, then its closest friend, then its worst rival — only those on its own
 * ground, never itself, each once (a parent who is also the friend comes as a parent).
 */
export function moltWitnesses(o: {
  name: string;
  parents?: readonly string[];
  friend?: string | null;
  rival?: string | null;
  groundOf: (n: string) => string | undefined;
}): Witness[] {
  const ground = o.groundOf(o.name);
  const out: Witness[] = [];
  const add = (who: string | null | undefined, role: WitnessRole): void => {
    if (!who || who === o.name || out.some((w) => w.who === who)) return;
    if (o.groundOf(who) === undefined || o.groundOf(who) !== ground) return;
    out.push({ who, role });
  };
  for (const p of o.parents ?? []) add(p, 'parent');
  add(o.friend, 'friend');
  add(o.rival, 'rival');
  return out;
}

/** What a witness says when it reaches the grown dino (BACKLOG-605). */
export function witnessLine(role: WitnessRole, name: string): string {
  if (role === 'parent') return `${MOLT_GLYPH} That's my ${name}. All grown.`;
  if (role === 'friend') return `Look at you, ${name}!`;
  return 'Still small to me.';
}

export function witnessMemory(name: string): string {
  return `saw ${name} grow up`;
}

/**
 * How the stage colours a greeting to the keeper (BACKLOG-605): a youngster greets as one; the first greet after the
 * molt says so; after that, nothing. No record → nothing.
 */
export function stageOpener(stage: 'young' | 'adult', rec: { moltedAtMin?: number; greeted?: boolean } | undefined): string | null {
  if (!rec) return null;
  if (stage === 'young') return "*bounces* I'm nearly big, you know.";
  if (rec.moltedAtMin !== undefined && !rec.greeted) return `${MOLT_GLYPH} Notice anything? I'm grown.`;
  return null;
}
