/**
 * Brain-biased intent (BACKLOG-393) — the choosing layer over the deterministic behavior floor.
 *
 * Each in-game day every dino gets an intent: a lean on how it wants the day to go. Where a model
 * runs, the brain authors it (once, cached, async — never per step); everywhere else a seeded
 * procedural author stands in, so the sim is whole with zero download (headless CI, declined
 * consent, stub brain). The intent never *decides* anything: it only scales the existing rolls in
 * WorldScene's step loop, inside hard clamps. The model authors no world state — CHARTER boundary.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable.
 */

import { hashSeed, mulberry32, type Personality } from './personality';

export type IntentKind = 'social' | 'solitary' | 'forage' | 'restless';

export const INTENT_KINDS: ReadonlyArray<IntentKind> = ['social', 'solitary', 'forage', 'restless'];

export interface DinoIntent {
  kind: IntentKind;
  /** A short in-voice note, shown in the collection book ("today: …"). */
  note: string;
  /** The in-game day this intent is good through; the next day re-authors. */
  until: number;
}

/** The deterministic note per kind — what the book shows when no model coloured it. */
export const INTENT_NOTES: Record<IntentKind, string> = {
  social: 'feels like company today',
  solitary: 'keeping to itself today',
  forage: 'has food on the brain',
  restless: 'itchy feet today',
};

/**
 * The seeded procedural author — the deterministic floor. Same (name, day) → same intent, always.
 * Traits weight the pick so the lean is in-character: a social dino leans social, a cautious
 * homebody leans solitary, a curious one forage, an energetic one restless.
 */
export function proceduralIntent(name: string, day: number, traits: Personality): DinoIntent {
  const rand = mulberry32(hashSeed(`${name}#intent#${day}`));
  const weights: Array<[IntentKind, number]> = [
    ['social', 0.2 + traits.sociability],
    ['solitary', 0.2 + (1 - traits.sociability)],
    ['forage', 0.2 + traits.curiosity],
    ['restless', 0.2 + traits.energy],
  ];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let roll = rand() * total;
  let kind: IntentKind = 'social';
  for (const [k, w] of weights) {
    roll -= w;
    if (roll <= 0) {
      kind = k;
      break;
    }
  }
  return { kind, note: INTENT_NOTES[kind], until: day };
}

/** What a brain hands back — untrusted until `fromDraft` validates it. */
export interface IntentDraft {
  kind: string;
  note: string;
}

/** The book note length cap — a note is a phrase, not a paragraph. */
export const NOTE_MAX = 60;

/**
 * Fold a brain draft onto the procedural fallback: an unknown kind, a null draft, or an empty note
 * keeps the fallback's field. Garbage in → deterministic floor out, never a crash.
 */
export function fromDraft(draft: IntentDraft | null, fallback: DinoIntent): DinoIntent {
  if (!draft || !INTENT_KINDS.includes(draft.kind as IntentKind)) return fallback;
  const note = draft.note.trim().slice(0, NOTE_MAX);
  return { kind: draft.kind as IntentKind, note: note || fallback.note, until: fallback.until };
}

/* ---- weight nudges — every one pure and clamped, so no intent can freeze or peg a behavior ---- */

/** The step loop's base socialize chance (the literal 0.45 the roll used before 393). */
export const SOCIALIZE_BASE = 0.45;

/** Socialize roll chance under an intent. Clamped to [0.05, 0.95]. */
export function socializeChanceFor(intent?: DinoIntent): number {
  const c = intent?.kind === 'social' ? 0.65 : intent?.kind === 'solitary' ? 0.25 : SOCIALIZE_BASE;
  return Math.min(0.95, Math.max(0.05, c));
}

/** Tic-onset threshold under an intent: a solitary day halves it, floored at half the base. */
export function ticAfterFor(intent: DinoIntent | undefined, base: number): number {
  const floor = Math.ceil(base / 2);
  return intent?.kind === 'solitary' ? floor : base;
}

/** Effective curiosity for the resource-notice roll: a forage day widens it, capped at 1. */
export function forageCuriosity(curiosity: number, intent?: DinoIntent): number {
  return intent?.kind === 'forage' ? Math.min(1, curiosity + 0.25) : curiosity;
}

/**
 * A restless day re-rolls a "stay" wander pick once (dir index 0), so the dino moves more without
 * ever being *forbidden* to rest — the re-roll may land on 0 again.
 */
export function rerollStay(intent: DinoIntent | undefined, dirIndex: number, reroll: () => number): number {
  return intent?.kind === 'restless' && dirIndex === 0 ? reroll() : dirIndex;
}
