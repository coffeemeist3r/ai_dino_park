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
import { ZONE_LINKS, type Edge } from './zones';
import { hopToward } from './distance';

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
 * The axis a dino's ritual comes from: the one furthest from neutral (0.5), ties resolved by AXES order (the
 * same dominant-axis read `fidget` uses). Deterministic per dino.
 *
 * Split out of `signatureTic` for BACKLOG-407: the *key* is what a save can hold and a friend can pick up,
 * where the `Tic` is a rendering of it. Persist the key, derive the glyph.
 */
export function signatureAxis(p: Personality): keyof Personality {
  let bestAxis: keyof Personality = AXES[0].key;
  let bestDev = -1;
  for (const axis of AXES) {
    const dev = Math.abs(p[axis.key] - 0.5);
    if (dev > bestDev) {
      bestDev = dev;
      bestAxis = axis.key;
    }
  }
  return bestAxis;
}

/**
 * A dino's signature tic: the ritual of its most-pronounced trait. What this dino was *born* with — a dino
 * that has picked one up from a friend (407) performs that one instead, and the caller reads the echo first.
 */
export function signatureTic(p: Personality): Tic {
  return TIC_BY_AXIS[signatureAxis(p)];
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

/**
 * Self-soothing onset (BACKLOG-412) — a dino that came away from a contested drop with nothing (it slunk off
 * from a winner that wouldn't budge, 394, or it was the winner that ceded to a gobbler, 387) takes up its
 * ritual far sooner than a contented one, so the sting has a visible aftermath instead of vanishing the
 * moment the food does. Below `TIC_AFTER_STEPS_HOMESICK`: a fresh wound reads faster than unfamiliar ground.
 *
 * Composes by `Math.min` with the other two shorteners, like 410 does — no branch outranks another, and the
 * lowest applicable threshold wins.
 */
export const TIC_AFTER_STEPS_STUNG = 6;

/** How many of the dino's own wander steps a sting stays fresh. Past this the onset returns to normal — a
 *  bad moment at the hatch is a mood, not a state. Deliberately short enough that a fed or accompanied dino
 *  is over it well within a play session. */
export const STING_FADES_AFTER_STEPS = 24;

/** Is a sting still fresh, given how many wander steps have passed since it (BACKLOG-412)? */
export function stingIsFresh(stepsSince: number): boolean {
  return stepsSince >= 0 && stepsSince < STING_FADES_AFTER_STEPS;
}

/**
 * The memory a *stung* dino files when its ritual forms (BACKLOG-412) — the self-soothing twin of
 * `ticMemory`. Names the ritual and says why it started, so the aftermath is legible in talk and not only
 * in the body. Filed once per sting, never alongside the plain 405 note.
 */
export function soothingTicMemory(label: string): string {
  return `it went badly at the hatch — you ${label} until it stopped smarting`;
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
 * The edge a departed friend left by (BACKLOG-414) — the direction from the grieving dino's zone toward the
 * zone its closest friend has crossed to. null when the friend shares the dino's zone (no ache) or is
 * unreachable.
 *
 * **BACKLOG-478 rewrote this.** It used to compare `zoneChain()` indices and answer 'east' when the friend
 * sat later in the chain. That was correct only because the park was a line: with the Ridge branching north
 * off the Grove, the branch lands at the *end* of the chain via the append-the-unreached fallback, so a
 * Grove dino grieving a friend on the Ridge would have been sent to pace at the east wall — a direction its
 * friend did not go and, from the Ridge's own side, an edge that does not exist. The honest read is the
 * graph: take the first hop toward the friend (475) and answer with that link's own edge. Every pre-478
 * east/west answer is unchanged, because on a line the next hop *is* the chain direction.
 */
export function griefEdge(dinoZone: string, friendZone: string): Edge | null {
  const next = hopToward(dinoZone, friendZone);
  if (!next) return null;
  return ZONE_LINKS.find((l) => l.from === dinoZone && l.to === next)?.edge ?? null;
}

/**
 * The tile a grieving dino aims its ritual at (BACKLOG-414): the tile on the edge its friend left by, so the
 * tic faces the way they went. West → column 0, east → last column, both holding the dino's own row; north →
 * row 0, south → last row, both holding its column (BACKLOG-478 — a vertical edge preserves the other axis).
 */
export function griefAnchor(edge: Edge, from: Tile, cols: number, rows: number): Tile {
  if (edge === 'north') return { tileX: from.tileX, tileY: 0 };
  if (edge === 'south') return { tileX: from.tileX, tileY: rows - 1 };
  return { tileX: edge === 'west' ? 0 : cols - 1, tileY: from.tileY };
}

/** The one-time memory a grieving dino files (BACKLOG-414) — names the friend + the ritual, so the ache is legible in talk. */
export function griefTicMemory(label: string, friend: string): string {
  return `your closest friend ${friend} crossed away — you ${label} at the edge they left by`;
}

/* ---------------------------------------------------------------------------------------------------
 * A ritual that spreads (BACKLOG-407).
 *
 * Forty-six cycles of private ritual, and nothing in this park had ever acquired a behaviour from another
 * living dino: traits are name-seeded at birth (010), blended from two parents at a hatch (042), or nudged
 * within a capped band by a dino's own experience (043/187). None of them travel sideways. This is the first
 * thing that does — watch a close friend at its ritual often enough and you pick up a faint echo of it.
 *
 * The **band** is the design, not the tally. A tic only forms when nobody is within `TIC_COMPANY_RANGE`, so
 * the dino near enough to learn from you is by construction the one that did *not* walk over and break the
 * solitude the ritual needs. Company and watching are mutually exclusive by the same number, which is why
 * that number is read here rather than a second one being invented.
 * ------------------------------------------------------------------------------------------------- */

/** Outer edge of the watching band — further than company, close enough to see what a friend is doing. */
export const ECHO_WATCH_RANGE = 8;

/** How close a pair must be for one to pick up the other's ritual. The same bar the ache (414) and the
 *  comfort visit (013) already use for "a real friend" — aliased, never a second number. */
export const ECHO_BOND_FLOOR = GRIEF_BOND_FLOOR;

/** How many separate solitary stretches of a friend's ritual it takes before the watcher picks it up. */
export const ECHO_WATCHES_NEEDED = 3;

/** Is this dino watching, rather than interrupting? Strictly outside company range, inside the band. */
export function watchingTic(dist: number): boolean {
  return dist > TIC_COMPANY_RANGE && dist <= ECHO_WATCH_RANGE;
}

/** Has a watcher seen enough of a close-enough friend's ritual to take it up? Both bars, never one. */
export function picksUpTic(watches: number, bond: number): boolean {
  return watches >= ECHO_WATCHES_NEEDED && bond >= ECHO_BOND_FLOOR;
}

/**
 * The borrowed ritual: the same motion and the same mark, described as the second-hand thing it is. Keeping
 * `kind` and `glyph` is what makes the echo free downstream — the sting note (412), the ache (414), the
 * caught-mid-ritual openers (408/413) and the pacing trace (424) all read a `Tic` and none of them learn a
 * new branch.
 */
export function echoedTic(t: Tic): Tic {
  return { ...t, label: `${t.label}, picked up from a friend` };
}

/** The one-time memory a watcher files when a friend's ritual takes — names both, so the mimicry is legible in talk. */
export function echoTicMemory(label: string, friend: string): string {
  return `you have started to ${label} — you caught it off ${friend}, watching them at it alone`;
}

/** The ticker beat the moment a ritual crosses between two dinos. */
export function echoedLine(watcher: string, friend: string, glyph: string): string {
  return `${glyph} ${watcher} has picked up ${friend}'s little ritual`;
}
