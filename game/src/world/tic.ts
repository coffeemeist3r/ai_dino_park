/**
 * Solitary tic (BACKLOG-405) — distinctness from *idleness*, not interaction.
 *
 * Four cycles of hatch-standoff beats (yield 375 / gobble 387 / stand 390 / slink 394) spent the whole
 * personality budget on one dino reacting to another over a scrap. This turns inward: a dino left with
 * nothing pressing and nobody in range invents a small private ritual — it paces a fixed little path,
 * fusses over one spot, or turns a slow circle — keyed to its most-pronounced trait, so even the bowl's
 * dead air reads as five distinct individuals. Deterministic from the name-seeded personality (010), filed
 * to memory the first time so it can surface later in talk.
 *
 * Pure TypeScript (no Phaser, no WebLLM): the tic choice, the onset threshold, and the little motion are all
 * decided here and unit-tested; WorldScene tracks each dino's solitary stretch and drives the step + float +
 * memory. Sibling in spirit to world/fidget.ts (the idle *glyph*); this is the idle *behavior*.
 */

import { AXES, type Personality } from '../ai/personality';
import { FOND_MIN } from '../ai/brain';
import type { Tile } from './movement';

export type TicKind = 'pace' | 'fuss' | 'circle';

export interface Tic {
  kind: TicKind;
  glyph: string;
  label: string;
}

/**
 * One signature ritual per personality axis — a dino invents the tic of its most-pronounced trait. Only three
 * *motions* exist (pace/fuss/circle), so kinds repeat across the five axes, but each axis keeps its own glyph
 * and label so the ritual still reads as that dino's own. Glyphs are disjoint from the feeding/mood marks.
 */
export const TIC_BY_AXIS: Record<keyof Personality, Tic> = {
  curiosity: { kind: 'fuss', glyph: '🔎', label: 'fusses over one spot' },
  sociability: { kind: 'circle', glyph: '🔁', label: 'turns a slow circle, as if looking for someone' },
  energy: { kind: 'pace', glyph: '🐾', label: 'paces a fixed little path' },
  agreeableness: { kind: 'fuss', glyph: '🍃', label: 'tidies the same patch of ground' },
  bravery: { kind: 'circle', glyph: '🌀', label: 'turns slowly on the spot' },
};

/**
 * A dino's signature tic: the ritual of its most-pronounced trait — the axis furthest from neutral (0.5),
 * ties resolved by AXES order (the same dominant-axis read `fidget` uses). Deterministic per dino.
 */
export function signatureTic(p: Personality): Tic {
  let bestAxis: keyof Personality = AXES[0].key;
  let bestDev = -1;
  for (const axis of AXES) {
    const dev = Math.abs(p[axis.key] - 0.5);
    if (dev > bestDev) {
      bestDev = dev;
      bestAxis = axis.key;
    }
  }
  return TIC_BY_AXIS[bestAxis];
}

/** Solitary force-steps before a dino falls into its tic (~a long real stretch at WANDER_STEP_MS). */
export const TIC_AFTER_STEPS = 20;

/** Tiles within which another dino in the same zone counts as company (so no tic forms). */
export const TIC_COMPANY_RANGE = 3;

/** Is the dino undisturbed this step — nothing pressing, no food to chase, and no company near? */
export function undisturbed(hasPressingNeed: boolean, foodRush: boolean, companyNear: boolean): boolean {
  return !hasPressingNeed && !foodRush && !companyNear;
}

/** Has a dino been solitary long enough to invent its tic? */
export function inventsTic(soloSteps: number): boolean {
  return soloSteps >= TIC_AFTER_STEPS;
}

/**
 * The little motion of a tic, driven by a step phase around the `anchor` tile where the dino settled.
 * `pace` steps one tile east and back; `circle` cycles the four tiles around the anchor; `fuss` holds the
 * spot. Pure tile math, clamped to the cols×rows grid — a pace/circle stays within one tile of the anchor.
 */
export function ticStep(kind: TicKind, anchor: Tile, phase: number, cols: number, rows: number): Tile {
  const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi - 1, v));
  if (kind === 'pace') {
    return { tileX: clamp(anchor.tileX + (phase % 2), cols), tileY: clamp(anchor.tileY, rows) };
  }
  if (kind === 'circle') {
    const ring: ReadonlyArray<readonly [number, number]> = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    const [dx, dy] = ring[phase % 4];
    return { tileX: clamp(anchor.tileX + dx, cols), tileY: clamp(anchor.tileY + dy, rows) };
  }
  return { tileX: clamp(anchor.tileX, cols), tileY: clamp(anchor.tileY, rows) }; // fuss: hold the spot
}

/** The one-time memory a dino files when it invents its tic (surfaces later via the greeting/reflection path). */
export function ticMemory(label: string): string {
  return `alone a long while, you ${label} — a little ritual of your own`;
}

/**
 * Caught mid-tic (BACKLOG-408) — the keeper greets a dino deep in its private ritual (405) and it startles.
 * The bashful frame is prefixed to whatever the brain (or the stub) returns, so a caught dino sounds sheepish
 * without asking the model to be — deterministic, model-free, and identical under the NPCBrain boundary.
 */
export function bashfulOpener(): string {
  return '*caught mid-fidget* Oh—! You... um. Didn\'t see you there. Hello.';
}

/** The one-time memory a caught dino files — the ritual named, so it reads as being seen doing something private. */
export function caughtMemory(label: string): string {
  return `the keeper caught you mid-ritual — you ${label}, and went a little bashful`;
}

/**
 * Fond of being caught (BACKLOG-413) — the same catch reads *opposite* by bond. A dino that already loves the
 * keeper (hearts ≥ FOND_MIN, the close-friend floor the fond greeting 272 already uses) isn't embarrassed to be
 * seen mid-ritual — it's pleased you came by, and shows the tic off instead of hiding it. Deterministic from
 * friendship, model-free: the fond frame wraps the reply exactly like the bashful one (408), so 413 is just a
 * fork on which frame + memory to use — never a change to the sim or a bond.
 */
export function fondOfBeingCaught(hearts: number): boolean {
  return hearts >= FOND_MIN;
}

/** The pleased opener a *fond* caught dino leads with — the warm twin of `bashfulOpener` (it shows the ritual off). */
export function fondOpener(): string {
  return '*looks up, delighted* Oh, it\'s you! You caught me at my little ritual — I don\'t mind, not with you here.';
}

/** The glad one-time memory a fond caught dino files — the ritual named, read as being happily, not sheepishly, seen. */
export function fondCaughtMemory(label: string): string {
  return `the keeper caught you mid-ritual — you ${label}, and you were glad it was them`;
}
