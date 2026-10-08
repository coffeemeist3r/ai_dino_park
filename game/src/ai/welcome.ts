/**
 * The ground answers a newcomer (BACKLOG-589, Milestone 26 lore arc 3) — one arrival, answered many ways.
 *
 * Everyone standing on a ground sees the same dino cross onto it. What each one does reads off who it is and how its
 * yesterday went (583): the dino that spent yesterday with the newcomer is glad it came, a sociable one whose yesterday
 * was empty brightens at the company, a rival bristles, a curious one wants a look, a loner turns its back.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable.
 */

import { hashSeed, mulberry32, type Personality } from './personality';
import { CURIOUS, type SeekWhy } from './companion';
import { MISSES_COMPANY, type Reflection } from './reflection';

export type WelcomeKind = 'bristle' | 'missed' | 'company' | 'curious' | 'cold';

/** Below this sociability a resident turns its back on a newcomer. */
export const LONER = 0.3;
/** A curious resident wants a look at a newcomer it has met fewer times than this. */
export const STRANGER_MET = 3;

export interface WelcomeContext {
  /** The resident's latest dusk reflection, if it has one. */
  yesterday?: Reflection;
  /** Whether the newcomer is the resident's rival. */
  rival: boolean;
  /** How many times the two have met. */
  met: number;
}

/** How `resident` answers `newcomer` crossing onto its ground, in rule order; null carries on. */
export function answerArrival(resident: string, traits: Personality, newcomer: string, ctx: WelcomeContext): WelcomeKind | null {
  if (resident === newcomer) return null;
  if (ctx.rival) return 'bristle';
  if (ctx.yesterday?.best === newcomer) return 'missed';
  if (ctx.yesterday && !ctx.yesterday.best && traits.sociability >= MISSES_COMPANY) return 'company';
  if (traits.curiosity >= CURIOUS && ctx.met < STRANGER_MET) return 'curious';
  if (traits.sociability < LONER) return 'cold';
  return null;
}

const TEXT: Record<WelcomeKind, readonly [string, string]> = {
  bristle: ['Oh. You.', 'Not you again, @.'],
  missed: ['There you are, @! I was hoping.', 'Back! Good. I missed you.'],
  company: ['Company! Finally.', 'Oh good. Someone to talk to.'],
  curious: ["Who's this, then?", "@, isn't it? Let me look at you."],
  cold: ['…', 'Another one.'],
};

/** What the resident says, in one of two name-seeded wordings. `@` is the newcomer. */
export function welcomeText(kind: WelcomeKind, resident: string, newcomer: string): string {
  return TEXT[kind][mulberry32(hashSeed(`${resident}#welcome`))() < 0.5 ? 0 : 1].replaceAll('@', newcomer);
}

const GIST: Record<WelcomeKind, string> = {
  bristle: 'bristles',
  missed: 'glad it came',
  company: 'brightens',
  curious: 'curious',
  cold: 'turns away',
};

/** The one ticker line: who on the ground answered how. */
export function welcomeLine(newcomer: string, zoneName: string, answers: ReadonlyArray<{ name: string; kind: WelcomeKind }>): string {
  return `🌿 ${zoneName} answers ${newcomer}: ${answers.map((a) => `${a.name} ${GIST[a.kind]}`).join(', ')}.`;
}

/** The mark over each resident that answers (BACKLOG-593 draws it; the glyph until then). */
export const WELCOME_ART_KEY = 'welcome';
export const WELCOME_GLYPH = '🌿';

const SEEK_FOR: Record<WelcomeKind, SeekWhy | null> = {
  bristle: 'rival',
  missed: 'yesterday',
  company: 'friend',
  curious: 'stranger',
  cold: null,
};

/** An answer moves the mind (BACKLOG-592): the reason the answerer now goes looking for the newcomer, or null (it turns away). */
export function answerSeek(kind: WelcomeKind): SeekWhy | null {
  return SEEK_FOR[kind];
}

export interface AnswerEffect {
  bond: number;
  grudge: number;
  meet: boolean;
}

const EFFECT: Record<WelcomeKind, AnswerEffect> = {
  bristle: { bond: 0, grudge: 3, meet: false },
  missed: { bond: 4, grudge: 0, meet: false },
  company: { bond: 4, grudge: 0, meet: false },
  curious: { bond: 2, grudge: 0, meet: true },
  cold: { bond: 0, grudge: 0, meet: false },
};

/** What an answer writes into the graphs (BACKLOG-592): a curious look is a meeting, so a stranger stops being one. */
export function answerEffect(kind: WelcomeKind): AnswerEffect {
  return EFFECT[kind];
}
