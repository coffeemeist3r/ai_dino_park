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
export const GLAD_GLYPH = '🥲';
/** `PROP_RIGS` key for the pair's nest (BACKLOG-622/623); `🪺` until it is drawn. */
export const NEST_ART_KEY = 'nest';
export const NEST_GLYPH = '🪺';
/** A friend below this was never close enough to be left behind (BACKLOG-621). */
export const JILT_FLOOR = 10;

/** Where a pair sleeps (BACKLOG-622): the ground and tile the courted one stood on when it said yes. */
export type Nest = { zone: string; tileX: number; tileY: number };
export type Pairs = Record<string, { mate: string; day: number; nest?: Nest }>;

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

export function pairUp(pairs: Pairs, a: string, b: string, day: number, nest?: Nest): Pairs {
  const n = nest ? { nest: { ...nest } } : {};
  return { ...pairs, [a]: { mate: b, day, ...n }, [b]: { mate: a, day, ...n } };
}

/** Side by side at the nest: the alphabetically first mate lies on it, the other beside it (inward at the east edge). */
export function berthOf(pairs: Pairs, name: string, cols: number): { tileX: number; tileY: number } | undefined {
  const p = pairs[name];
  if (!p?.nest) return undefined;
  const { tileX, tileY } = p.nest;
  if (name < p.mate) return { tileX, tileY };
  return { tileX: tileX + 1 < cols ? tileX + 1 : tileX - 1, tileY };
}

export interface Jilt {
  name: string;
  /** The one it loved best. */
  friend: string;
  /** The one who took it. */
  rival: string;
  mood: 'glad' | 'jealous';
}

/**
 * Who is left standing when `a` and `b` pair (BACKLOG-621): every unpaired dino whose closest friend of all was one of
 * them. Its own temper decides how it takes the news. No dice.
 */
export function jilted(
  a: string,
  b: string,
  ctx: { bonds: Bonds; names: readonly string[]; agreeableness: Readonly<Record<string, number>>; pairs: Pairs },
): Jilt[] {
  const out: Jilt[] = [];
  for (const name of ctx.names) {
    if (name === a || name === b || ctx.pairs[name]) continue;
    const friend = closestFriend(name, ctx.bonds, ctx.names as string[], JILT_FLOOR);
    if (friend !== a && friend !== b) continue;
    const rival = friend === a ? b : a;
    out.push({ name, friend, rival, mood: (ctx.agreeableness[name] ?? 0.5) >= 0.5 ? 'glad' : 'jealous' });
  }
  return out;
}

export function jiltLine(j: Jilt): string {
  return j.mood === 'glad' ? `${GLAD_GLYPH} Good for you, ${j.friend}.` : `😒 ${j.rival} took ${j.friend}.`;
}
export function jiltMemory(j: Jilt): string {
  return j.mood === 'glad'
    ? `${j.friend} paired off with ${j.rival}. I'm glad for them`
    : `${j.friend} paired off with ${j.rival}. ${j.rival} took my friend`;
}
export function jiltTicker(j: Jilt): string {
  return j.mood === 'glad'
    ? `${GLAD_GLYPH} ${j.name} is glad for ${j.friend} and ${j.rival}`
    : `😒 ${j.name} watches ${j.friend} pair off with ${j.rival}, and sulks`;
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
    return typeof p === 'object' && p !== null && typeof p.mate === 'string' && typeof p.day === 'number' && Number.isFinite(p.day) && (p.nest === undefined || isNest(p.nest));
  });
}

function isNest(raw: unknown): raw is Nest {
  const n = raw as Record<string, unknown> | null;
  return typeof n === 'object' && n !== null && typeof n.zone === 'string' && Number.isInteger(n.tileX) && Number.isInteger(n.tileY);
}
