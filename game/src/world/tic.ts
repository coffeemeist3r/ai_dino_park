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
import { zoneChain, type Edge } from './zones';

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

/**
 * Homesick-sooner onset (BACKLOG-410) — a dino freshly moved *alone* into a friendless zone falls into
 * its tic quicker than one on home ground, so isolation in an unfamiliar place reads faster. Below
 * `TIC_AFTER_STEPS`; the caller takes the *min* of this and the 393 solitary-day threshold, so the two
 * shorteners compose instead of fighting.
 */
export const TIC_AFTER_STEPS_HOMESICK = 12;

/**
 * Alone in a strange zone (BACKLOG-410) — the dino is freshly arrived (not yet *settled*, 341) and has no
 * bonded friend residing in its current zone. Such a dino invents its tic sooner. Pure: the two reads
 * (tenure→settled, same-zone bond graph→friend) are computed by the caller; this is the gate they feed.
 */
export function aloneInStrangeZone(settled: boolean, hasFriendInZone: boolean): boolean {
  return !settled && !hasFriendInZone;
}

/** Tiles within which another dino in the same zone counts as company (so no tic forms). */
export const TIC_COMPANY_RANGE = 3;

/** Is the dino undisturbed this step — nothing pressing, no food to chase, and no company near? */
export function undisturbed(hasPressingNeed: boolean, foodRush: boolean, companyNear: boolean): boolean {
  return !hasPressingNeed && !foodRush && !companyNear;
}

/** Has a dino been solitary long enough to invent its tic? A solitary-intent day (BACKLOG-393)
 *  passes a lower threshold; the default keeps every pre-393 caller byte-identical. */
export function inventsTic(soloSteps: number, after: number = TIC_AFTER_STEPS): boolean {
  return soloSteps >= after;
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

/**
 * A ritual for the missing friend (BACKLOG-414) — a real friend (pairwise bond ≥ this) whose departure
 * to another zone turns the tic into an ache. Below it, a crossing isn't a loss worth grieving. One
 * huddle's worth, matching `comfort.ts`'s COMFORT_BOND_FLOOR (013).
 */
export const GRIEF_BOND_FLOOR = 8;

/**
 * The edge a departed friend left by (BACKLOG-414) — the direction, along the west→east zone chain, from
 * the grieving dino's zone toward the zone its closest friend has crossed to. A friend further east in the
 * chain left by the 'east' edge; further west, by 'west'. null when the friend shares the dino's zone (no
 * ache) or either zone is off the chain. Reads `zoneChain` so a fourth zone needs no change here.
 */
export function griefEdge(dinoZone: string, friendZone: string): Edge | null {
  if (dinoZone === friendZone) return null;
  const chain = zoneChain();
  const di = chain.indexOf(dinoZone);
  const fi = chain.indexOf(friendZone);
  if (di < 0 || fi < 0 || di === fi) return null;
  return fi > di ? 'east' : 'west';
}

/**
 * The tile a grieving dino aims its ritual at (BACKLOG-414): the mid-height (its own row) tile on the edge
 * its friend left by, so the tic faces the way they went. West edge → column 0, east edge → last column.
 */
export function griefAnchor(edge: Edge, row: number, cols: number): Tile {
  return { tileX: edge === 'west' ? 0 : cols - 1, tileY: row };
}

/** The one-time memory a grieving dino files (BACKLOG-414) — names the friend + the ritual, so the ache is legible in talk. */
export function griefTicMemory(label: string, friend: string): string {
  return `your closest friend ${friend} crossed away — you ${label} at the edge they left by`;
}
