/**
 * Courtship (BACKLOG-618 / BACKLOG-620, Milestone 33). Pure TypeScript (no Phaser): Node-testable.
 *
 * Two grown, unpaired dinos who are each other's closest friend at `COURT_BOND` become a pair when they meet: the
 * bolder one courts with something out of its own persona, and the other says yes. A one-sided courtship is turned
 * down gently. No dice. WorldScene owns the meeting and the walk; the pair is a save field.
 */

import { bondPoints, closestFriend, type Bonds } from './bonds';

export const COURT_BOND = 24;
export const PAIR_BOND = 6;
export const MATE_EVERY = 5;
export const MATE_GLYPH = '💕';
export const DECLINE_GLYPH = '💔';

export type Pairs = Record<string, { mate: string; day: number }>;

/** Table order is match order; the fallback has no keywords. */
const GIFTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/fern|frond/, 'a fern'],
  [/rock|stone/, 'a pretty stone'],
  [/music|hum|song|sing/, 'a song'],
  [/sun/, 'a warm spot in the sun'],
  [/damp|water|pond|rain/, 'a cool drink at the pond'],
];

export function courtGift(persona: string): string {
  const p = persona.toLowerCase();
  return GIFTS.find(([re]) => re.test(p))?.[1] ?? 'a long walk';
}

export interface CourtContext {
  bonds: Bonds;
  /** Every live dino, so "closest friend" is closest of all, not of the two meeting. */
  names: readonly string[];
  bravery: Readonly<Record<string, number>>;
  young: ReadonlySet<string>;
  pairs: Pairs;
}

export interface Courtship {
  courter: string;
  courted: string;
  accept: boolean;
}

/** The bolder of the two courts if the other is its closest friend; else the other way round; else nobody. */
export function courtship(a: string, b: string, ctx: CourtContext): Courtship | null {
  if (a === b || ctx.young.has(a) || ctx.young.has(b) || ctx.pairs[a] || ctx.pairs[b]) return null;
  if (bondPoints(ctx.bonds, a, b) < COURT_BOND) return null;
  const closest = (n: string): string | null => closestFriend(n, ctx.bonds, ctx.names as string[], COURT_BOND);
  const bold = (n: string): number => ctx.bravery[n] ?? 0;
  const order = bold(a) > bold(b) || (bold(a) === bold(b) && a < b) ? [a, b] : [b, a];
  for (const [courter, courted] of [order, [order[1], order[0]]]) {
    if (closest(courter) === courted) return { courter, courted, accept: closest(courted) === courter };
  }
  return null;
}

export function pairUp(pairs: Pairs, a: string, b: string, day: number): Pairs {
  return { ...pairs, [a]: { mate: b, day }, [b]: { mate: a, day } };
}

/** One idle beat in `MATE_EVERY` shows 💕 (offset so it never lands on the faith glyph's beat). */
export function mateBeat(step: number): boolean {
  return step % MATE_EVERY === 4;
}

export function mateBookLine(pairs: Pairs, name: string): string | undefined {
  const p = pairs[name];
  return p ? `${MATE_GLYPH} sweet on ${p.mate} (since day ${p.day})` : undefined;
}

export function courtLine(gift: string): string {
  return `${MATE_GLYPH} I brought you ${gift}.`;
}
export function courtTicker(c: Courtship, gift: string): string {
  return c.accept
    ? `${MATE_GLYPH} ${c.courter} courts ${c.courted} with ${gift}. ${c.courted} says yes.`
    : `${DECLINE_GLYPH} ${c.courter} courts ${c.courted} with ${gift}. ${c.courted} turns ${c.courter} down gently.`;
}
export function courterMemory(c: Courtship, gift: string): string {
  return c.accept ? `I courted ${c.courted} with ${gift}, and ${c.courted} said yes` : `I courted ${c.courted} with ${gift}; ${c.courted} turned me down gently`;
}
export function courtedMemory(c: Courtship, gift: string): string {
  return `${c.courter} courted me with ${gift}, and I said yes`;
}

/** Save validation: every entry names a mate and the day the pair formed, or the save is corrupt. */
export function isPairs(raw: unknown): raw is Pairs {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;
  return Object.values(raw).every((v) => {
    const p = v as Record<string, unknown> | null;
    return typeof p === 'object' && p !== null && typeof p.mate === 'string' && typeof p.day === 'number' && Number.isFinite(p.day);
  });
}
