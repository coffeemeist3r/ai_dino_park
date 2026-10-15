/**
 * Life stages (BACKLOG-602) — the spine of the Growing-up tentpole (Milestone 30).
 *
 * A dino may carry a growth record: the absolute world minute it hatched, and, once it has grown up, when and how.
 * No record means adult — every founder but the founding youngster, and every dino in a save written before
 * cycle 187 — so nothing that predates this file reads differently. Pure (no Phaser).
 */

import type { Personality } from '../ai/personality';
import type { ChirpParams } from '../audio/chirp';
import type { MoltKind } from './molt';

export interface GrowthRecord {
  /** Absolute world minute (`timeToAbs`) the dino hatched. May be negative for a founder born before day 1. */
  hatchedAtMin: number;
  moltedAtMin?: number;
  moltedDay?: number;
  came?: MoltKind;
  /** The temperament it came out of the molt with — restored over the name-seeded traits on load. */
  traits?: Personality;
}

export type LifeStage = 'young' | 'adult';

/** How long youth lasts: two in-game days (~48 real minutes at the default clock). */
export const YOUTH_MIN = 2 * 24 * 60;

/** A young dino's sprite scale: a 20-cell rig baked at ×2 halves to one screen pixel per cell, so it stays crisp. */
export const YOUNG_SCALE = 0.5;

export function stageOf(rec: GrowthRecord | undefined, nowMin: number): LifeStage {
  if (!rec || rec.moltedAtMin !== undefined) return 'adult';
  return nowMin < rec.hatchedAtMin + YOUTH_MIN ? 'young' : 'adult';
}

/** Names whose youth has run out and who have not molted yet. */
export function moltDue(growth: Record<string, GrowthRecord>, nowMin: number): string[] {
  return Object.entries(growth)
    .filter(([, r]) => r.moltedAtMin === undefined && nowMin >= r.hatchedAtMin + YOUTH_MIN)
    .map(([n]) => n);
}

/** A youngster pipes: the same voice half again as high, clipped shorter. */
export function youngVoice(p: ChirpParams): ChirpParams {
  return { ...p, pitchHz: Math.round(p.pitchHz * 1.5), lengthMs: Math.round(p.lengthMs * 0.7) };
}

/** The book's line: how long until it grows up, or when it did and how it came out. Undefined → no record. */
export function growthLine(rec: GrowthRecord | undefined, nowMin: number): string | undefined {
  if (!rec) return undefined;
  if (rec.moltedAtMin !== undefined) return `🐚 grew up on day ${rec.moltedDay ?? '?'} — came out ${rec.came ?? 'grown'}`;
  const hours = Math.max(1, Math.ceil((rec.hatchedAtMin + YOUTH_MIN - nowMin) / 60));
  return `🥚 young — grows up in ~${hours} h`;
}
