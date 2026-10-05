/**
 * Whom a mind goes looking for (BACKLOG-582, first slice of 104).
 *
 * A dino that drifts toward company used to walk to whoever was nearest. Now its persona picks *whom*, once per
 * day-phase, and the reason reads off who it is: a prickly dino with a rival on its ground goes looking for trouble;
 * a curious one seeks the zone-mate it knows least; one with a yesterday seeks the dino it spent it with; anyone else
 * seeks its warmest bond. How *often* it socializes is unchanged (393's lean); *whom* is the mind's.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable.
 */

import { bondPoints, type Bonds } from '../social/bonds';
import { RIVAL_BAR } from '../social/grudges';
import { pairKey } from '../social/meetings';
import { type Personality } from './personality';

export type SeekWhy = 'rival' | 'stranger' | 'yesterday' | 'friend';

export interface Companion {
  name: string;
  why: SeekWhy;
}

export interface SeekContext {
  bonds: Bonds;
  grudges: Bonds;
  meetings: Record<string, number>;
  /** Who it spent yesterday with (BACKLOG-583), if anyone. */
  yesterday?: string | null;
}

export const PRICKLY = 0.35;
export const CURIOUS = 0.6;
export const SEEK_ART_KEY = 'seek';
export const SEEK_GLYPH = '👀';

/** The pick, in rule order. `mates` are the dinos on its ground; `name` itself is skipped. */
export function chooseCompanion(name: string, traits: Personality, mates: readonly string[], ctx: SeekContext): Companion | null {
  const others = mates.filter((m) => m !== name).sort();
  if (!others.length) return null;
  const top = (score: (o: string) => number): string | null => {
    let best: string | null = null;
    for (const o of others) if (score(o) > 0 && (best === null || score(o) > score(best))) best = o;
    return best;
  };
  if (traits.agreeableness < PRICKLY) {
    const rival = top((o) => (bondPoints(ctx.grudges, name, o) >= RIVAL_BAR ? bondPoints(ctx.grudges, name, o) : 0));
    if (rival) return { name: rival, why: 'rival' };
  }
  if (traits.curiosity >= CURIOUS) {
    const met = (o: string) => ctx.meetings[pairKey(name, o)] ?? 0;
    const bond = (o: string) => bondPoints(ctx.bonds, name, o);
    const stranger = [...others].sort((a, b) => met(a) - met(b) || bond(a) - bond(b))[0];
    return { name: stranger, why: 'stranger' };
  }
  if (ctx.yesterday && others.includes(ctx.yesterday)) return { name: ctx.yesterday, why: 'yesterday' };
  const friend = top((o) => bondPoints(ctx.bonds, name, o));
  return friend ? { name: friend, why: 'friend' } : null;
}

const REASON: Record<SeekWhy, string> = {
  rival: 'spoiling for it',
  stranger: 'to get to know them',
  yesterday: 'for more of yesterday',
  friend: 'missing them',
};

/** The ticker line as it sets off. */
export function seekLine(seeker: string, c: Companion): string {
  return `${SEEK_GLYPH} ${seeker} goes looking for ${c.name} — ${REASON[c.why]}.`;
}

/** The book's "seeking:" line. */
export function seekingLine(c: Companion): string {
  return `${c.name} (${REASON[c.why]})`;
}

/** What it says when it gets there. */
export function arrivalText(c: Companion): string {
  if (c.why === 'rival') return `You again, ${c.name}.`;
  if (c.why === 'stranger') return `Don't think we've met properly, ${c.name}.`;
  if (c.why === 'yesterday') return `${c.name}! Same again today?`;
  return `There you are, ${c.name}.`;
}
