/**
 * Faith (BACKLOG-030 / BACKLOG-613, Milestone 32). Pure TypeScript (no Phaser): Node-testable.
 *
 * When the first festival closes, the most curious awake dino of the host ground stays at the pond and preaches a
 * creed its own persona picks. Who believes it reads off the bond graph, who scoffs off the grudge graph — no dice,
 * because a draw on the shared stream moves every other dino's. The faith is then a save field with an hour: every
 * afternoon the preacher and its believers gather where the sermon was given. WorldScene owns the walk.
 */

import type { GameTime } from './clock';
import { bondPoints, type Bonds } from '../social/bonds';
import { worstRival } from '../social/grudges';

export type CreedId = 'song' | 'stones' | 'sun' | 'water' | 'old' | 'sky';

export interface Creed {
  id: CreedId;
  /** What it preaches, as the book names it. */
  name: string;
  /** The one-word handle a scoffer uses ("Glade's song"). */
  short: string;
  glyph: string;
  /** The sermon, in the preacher's mouth. */
  sermon: string;
  /** A believer's bubble. */
  believe: string;
  /** Persona keywords that pick this creed; the fallback has none. */
  match?: RegExp;
}

/** Table order is match order: the first creed whose keywords appear in the persona wins. */
export const CREEDS: readonly Creed[] = [
  { id: 'song', name: 'the song under the grass', short: 'song', glyph: '🎶', match: /music|hum|song|sing/, sermon: "There's a song under the grass. Hush, and you'll hear it.", believe: 'I hear it too.' },
  { id: 'stones', name: 'the stones', short: 'stones', glyph: '🪨', match: /rock|stone/, sermon: "The stones were here first. They'll be here after. Sit with them.", believe: 'The stones. Yes.' },
  { id: 'sun', name: 'the sun', short: 'sun', glyph: '☀️', match: /sun/, sermon: 'The sun comes back every morning. It has never once forgotten us.', believe: 'It always comes back.' },
  { id: 'water', name: 'the water', short: 'water', glyph: '💧', match: /damp|water|pond|rain/, sermon: 'All the water is one water. It remembers everyone who drank.', believe: 'It remembers me.' },
  { id: 'old', name: 'the old ways', short: 'old ways', glyph: '🌿', match: /old|remember/, sermon: 'The ferns remember what we forget. Walk the way they grew.', believe: 'The old ways.' },
  { id: 'sky', name: 'the sky', short: 'sky', glyph: '✨', sermon: 'Something up there is watching. Be kind where it can see.', believe: "I'll be kind." },
];

export const HEED_BOND = 10;
export const SERVICE_HOUR = 16;
export const SERVICE_MIN = 60;
export const FAITH_EVERY = 5;
export const FAITH_ART_KEY = 'faith-stone';
export const SCOFF_GLYPH = '🙄';

export function creedById(id: CreedId): Creed {
  return CREEDS.find((c) => c.id === id)!;
}

export function creedFor(persona: string): Creed {
  const p = persona.toLowerCase();
  return CREEDS.find((c) => c.match?.test(p)) ?? creedById('sky');
}

export interface PreacherCandidate {
  name: string;
  curiosity: number;
  awake: boolean;
  home: string;
}

/** The most curious awake candidate whose home is the host ground (ties by name); null when nobody qualifies. */
export function pickPreacher(cands: readonly PreacherCandidate[], host: string): string | null {
  const ok = cands.filter((c) => c.awake && c.home === host);
  ok.sort((a, b) => b.curiosity - a.curiosity || a.name.localeCompare(b.name));
  return ok[0]?.name ?? null;
}

export interface Hearing {
  believers: string[];
  /** scoffer → whom it will not follow (the preacher, or a believer it holds a grudge against). */
  scoffers: Record<string, string>;
  unmoved: string[];
}

/** Love believes first; then a grudge against the preacher or any believer scoffs; the rest are unmoved. */
export function hearSermon(preacher: string, hearers: readonly string[], bonds: Bonds, grudges: Bonds): Hearing {
  const others = hearers.filter((n) => n !== preacher);
  const believers = others.filter((n) => bondPoints(bonds, preacher, n) >= HEED_BOND);
  const scoffers: Record<string, string> = {};
  const unmoved: string[] = [];
  for (const n of others) {
    if (believers.includes(n)) continue;
    const foe = worstRival(n, grudges, [preacher, ...believers]);
    if (foe) scoffers[n] = foe;
    else unmoved.push(n);
  }
  return { believers, scoffers, unmoved };
}

export interface Faith {
  creed: CreedId;
  preacher: string;
  zone: string;
  tileX: number;
  tileY: number;
  /** The in-game day it was preached. */
  day: number;
  believers: string[];
  scoffers: Record<string, string>;
  /** The last in-game day a service was held (or skipped for want of a congregation). */
  lastServiceDay?: number;
}

export type FaithPart = 'preacher' | 'believer' | 'scoffer';

export function faithOf(faith: Faith | null, name: string): FaithPart | null {
  if (!faith) return null;
  if (faith.preacher === name) return 'preacher';
  if (faith.believers.includes(name)) return 'believer';
  if (faith.scoffers[name]) return 'scoffer';
  return null;
}

/** One idle beat in `FAITH_EVERY` shows the creed glyph (offset so it never lands on the kept habit's beat 0). */
export function faithBeat(step: number): boolean {
  return step % FAITH_EVERY === 2;
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function sermonTicker(preacher: string, creed: Creed): string {
  return `${creed.glyph} ${preacher} stays at the pond and preaches: "${creed.sermon}"`;
}

/** Null when nobody believed and nobody scoffed. */
export function heardTicker(preacher: string, creed: Creed, h: Hearing): string | null {
  const parts: string[] = [];
  if (h.believers.length) parts.push(`${joinNames(h.believers)} ${h.believers.length === 1 ? 'believes' : 'believe'} ${preacher}.`);
  const sc = Object.keys(h.scoffers);
  if (sc.length) parts.push(`${joinNames(sc)} ${sc.length === 1 ? 'scoffs' : 'scoff'}.`);
  return parts.length ? `${creed.glyph} ${parts.join(' ')}` : null;
}

export function faithBookLine(faith: Faith | null, name: string): string | undefined {
  const part = faithOf(faith, name);
  if (!faith || !part) return undefined;
  const c = creedById(faith.creed);
  if (part === 'preacher') return `${c.glyph} preaches ${c.name} (since day ${faith.day})`;
  if (part === 'believer') return `${c.glyph} follows ${faith.preacher}'s word: ${c.name}`;
  const foe = faith.scoffers[name];
  return `${SCOFF_GLYPH} won't hear ${faith.preacher}'s ${c.short}${foe !== faith.preacher ? ` — not where ${foe} goes` : ''}`;
}

export function preachMemory(c: Creed): string {
  return `I stood up at the festival's end and told them about ${c.name}`;
}
export function believeMemory(preacher: string, c: Creed): string {
  return `${preacher} preached about ${c.name}, and I believed it`;
}
export function scoffMemory(preacher: string, c: Creed, foe: string): string {
  return `${preacher} preached about ${c.name}; I wasn't having it${foe !== preacher ? `, not with ${foe} nodding along` : ''}`;
}
export function serviceMemory(preacher: string, c: Creed): string {
  return `we sat with ${preacher} at the pond for ${c.name}`;
}

export function serviceTicker(preacher: string, c: Creed, believers: readonly string[]): string {
  return `${c.glyph} ${preacher}'s faithful gather at the pond for ${c.name}: ${joinNames(believers)}.`;
}
export function serviceClosedLine(c: Creed): string {
  return `${c.glyph} The faithful drift off from the pond.`;
}

/** Due in the service hour, on or after the sermon day, once a day. */
export function serviceDue(t: GameTime, faith: Faith | null): boolean {
  if (!faith || t.hour !== SERVICE_HOUR || t.day < faith.day) return false;
  return (faith.lastServiceDay ?? 0) < t.day;
}

export interface Present {
  name: string;
  zone: string;
  awake: boolean;
  migrating: boolean;
}

/** The preacher and every believer standing, awake and settled, on the faith's ground. */
export function serviceAttendees(faith: Faith, present: readonly Present[]): string[] {
  const flock = new Set([faith.preacher, ...faith.believers]);
  return present.filter((p) => flock.has(p.name) && p.zone === faith.zone && p.awake && !p.migrating).map((p) => p.name);
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Save validation: a faith is either well-formed or the save is corrupt. */
export function isFaith(raw: unknown): raw is Faith {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return false;
  const f = raw as Record<string, unknown>;
  if (!CREEDS.some((c) => c.id === f.creed)) return false;
  if (typeof f.preacher !== 'string' || typeof f.zone !== 'string') return false;
  if (!isNum(f.tileX) || !isNum(f.tileY) || !isNum(f.day)) return false;
  if (f.lastServiceDay !== undefined && !isNum(f.lastServiceDay)) return false;
  if (!Array.isArray(f.believers) || !f.believers.every((b) => typeof b === 'string')) return false;
  const s = f.scoffers;
  if (typeof s !== 'object' || s === null || Array.isArray(s)) return false;
  return Object.values(s).every((v) => typeof v === 'string');
}
