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

import { AXES, hashSeed, mulberry32, type Personality } from '../ai/personality';
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
 * Caught again (BACKLOG-420) — the catch stops being a lookup.
 *
 * 408 and 413 gave the interruption two readings, bashful and pleased, and both are constant strings: a
 * player who walks up to the same ticcing dino five times inside one unbroken stretch of solitude gets the
 * identical opener five times, and the memory is filed once and then never again. A reaction that never
 * changes is not a mind.
 *
 * So the *fond* reading climbs across one stretch — pleased, then playful teasing, then fond resignation —
 * and floors there; a ninth catch is a third catch. The unfond reading does not climb at all, and that
 * flatness is the point rather than an omission: **the escalation is the tell that this dino likes you.**
 *
 * The stretch is the one `resetTic` clears (company or a pressing need), and the keeper walking up is not
 * company — `companyNear` counts only dinos — which is exactly why a repeat catch is reachable.
 */
export type CaughtRegister = 'bashful' | 'pleased' | 'teasing' | 'resigned';

/** The second catch in a stretch turns pleasure to teasing... */
export const CAUGHT_TEASE_AT = 2;
/** ...and the third settles into fond resignation, where it stays. */
export const CAUGHT_RESIGNED_AT = 3;

/** How this catch reads: the count within the stretch, forked on the 413 fondness gate. Floors at resigned. */
export function caughtRegister(catches: number, fond: boolean): CaughtRegister {
  if (!fond) return 'bashful';
  if (catches >= CAUGHT_RESIGNED_AT) return 'resigned';
  if (catches >= CAUGHT_TEASE_AT) return 'teasing';
  return 'pleased';
}

/**
 * One tease per axis, in the voice `TIC_BY_AXIS` established. A single "you again?" would have made all
 * eight dinos object identically, which is the sameness the CHARTER calls a defect — so a curious dino
 * accuses you of taking notes, a jittery one of sneaking, an aloof one is pointedly unbothered.
 */
const TEASE_BY_AXIS: Record<keyof Personality, string> = {
  curiosity: '*narrows its eyes* You again? Are you writing this down somewhere?',
  sociability: '*grins* Twice now! Admit it — you came back for the show.',
  energy: '*still pacing, faster* You— again? Some of us are busy, you know.',
  agreeableness: '*sets the leaf down, patiently* You do keep turning up while I am tidying.',
  bravery: '*does not stop turning* Spying on me, then. Bold of you.',
};

/** ...and one resignation per axis: caught three times in a row, a dino stops pretending to mind. */
const RESIGNED_BY_AXIS: Record<keyof Personality, string> = {
  curiosity: '*does not even look up* Fine. Pull up a patch of ground and observe properly.',
  sociability: '*laughing* All right, all right — you live here now. Come on then.',
  energy: '*puffing* You are just going to stand there, are you. Suit yourself.',
  agreeableness: '*shifts over to make room* Well. You may as well help.',
  bravery: '*sighs, unbothered* Watch away. I have given up minding.',
};

/** The teasing opener for a dino performing the ritual of `axis` (its own, or one it picked up — 407). */
export function teaseOpener(axis: keyof Personality): string {
  return TEASE_BY_AXIS[axis];
}

/** The fondly-resigned opener, the third catch and every one after it. */
export function resignedOpener(axis: keyof Personality): string {
  return RESIGNED_BY_AXIS[axis];
}

/** What a teased dino files — the ritual named, the way 408/413's memories name it. */
export function teaseMemory(label: string): string {
  return `the keeper caught you mid-ritual twice over — you ${label}, and gave them a hard time for it`;
}

/** What a thrice-caught dino files: it has stopped guarding the ritual from this one. */
export function resignedMemory(label: string): string {
  return `the keeper kept catching you at it — you ${label}, and let them stay and watch`;
}

/**
 * The one entry point the scene calls, so no register `switch` leaks into `WorldScene`. The two existing
 * registers **call** `bashfulOpener`/`fondOpener` rather than restating their text — the compatibility seam
 * is "the old path *is* the old function", which is what keeps the 408 and 413 specs green by construction.
 */
export function caughtOpener(register: CaughtRegister, axis: keyof Personality): string {
  switch (register) {
    case 'bashful':
      return bashfulOpener();
    case 'pleased':
      return fondOpener();
    case 'teasing':
      return teaseOpener(axis);
    case 'resigned':
      return resignedOpener(axis);
  }
}

/** The memory for a register — the same shape as `caughtOpener`, delegating to the 408/413 builders. */
export function caughtRegisterMemory(register: CaughtRegister, label: string): string {
  switch (register) {
    case 'bashful':
      return caughtMemory(label);
    case 'pleased':
      return fondCaughtMemory(label);
    case 'teasing':
      return teaseMemory(label);
    case 'resigned':
      return resignedMemory(label);
  }
}

/* ---------------------------------------------------------------------------------------------------
 * Warmed by the catch (BACKLOG-422).
 *
 * 420 gave the interruption three readings that climb across one unbroken stretch of solitude — pleased,
 * teasing, fondly resigned — and the climb changed exactly one thing: which string got printed. Close the
 * dialog box and the park was bit-identical to a park where the keeper never walked over. The milestone's
 * arc says being found is a conversation rather than a lookup, and a conversation that moves nothing is a
 * lookup with better prose.
 *
 * So the **register is the price**. Being found warms the bond by however far the catch climbed, which makes
 * 420's escalation the mechanism instead of the decoration.
 *
 * `bashful` is worth **zero**, and that is load-bearing rather than an oversight. 420's own rule: the unfond
 * reading does not climb, *and that flatness is the tell that this dino likes you*. A dino that barely knows
 * you gains nothing from being found however often you find it. This is the same sentence in a second
 * register — do not "fix" it into a small positive number.
 * ------------------------------------------------------------------------------------------------- */

/** What each reading of a catch is worth in affinity points. The 420 climb, priced. */
export const CATCH_WARMTH: Record<CaughtRegister, number> = {
  bashful: 0,
  pleased: 2,
  teasing: 3,
  resigned: 4,
};

/** Exactly `2 + 3 + 4` — **one solitary stretch is worth exactly one full climb**. The fourth catch in a
 *  stretch is also `resigned` and also nominally worth 4, and pays nothing: a player standing on a ticcing
 *  dino mashing the greet key gets one climb's worth and then a great many nice sentences. */
export const CATCH_WARMTH_PER_STRETCH = 9;

/** Four full climbs, and **persisted**. The cycle-133 freshness-gate lesson applied to a bond: a warmth with
 *  no lifetime ceiling is a farm, and a ceiling that lives only in memory is a farm with a reload button. */
export const CATCH_WARMTH_LIFETIME = 36;

/**
 * What this catch actually grants, after both ceilings. One expression rather than two guards at the call
 * site, so neither cap can be applied in one place and forgotten in another.
 */
export function catchWarmth(register: CaughtRegister, earnedThisStretch: number, earnedLifetime: number): number {
  const stretchRoom = Math.max(0, CATCH_WARMTH_PER_STRETCH - earnedThisStretch);
  const lifeRoom = Math.max(0, CATCH_WARMTH_LIFETIME - earnedLifetime);
  return Math.max(0, Math.min(CATCH_WARMTH[register], stretchRoom, lifeRoom));
}

/** The beat, and only on a whole-heart crossing — the ticker reports what the player can see, and a heart is
 *  what the player can see. The yellow heart is disjoint from the pink one the friendship bar draws. */
export function catchWarmedLine(name: string): string {
  return `\u{1F49B} ${name} warms to you a little, for being found`;
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

/* ---------------------------------------------------------------------------------------------------
 * The ritual in the book (BACKLOG-409).
 *
 * Forty-seven cycles of the most per-dino behaviour in the park, and it has only ever existed in the
 * instant it was performed: a glyph floats, a ticker line scrolls, and a player looking at another dino
 * never learns it happened. The collection book (021) already keeps the shallower sibling of this fact —
 * the idle quirk (303) — and this is the line under it.
 *
 * Takes the **base** tic, never `echoedTic`'s reworded label: a borrowed ritual says so once, here, with
 * the friend it was caught off named. Passing the echoed label would print the provenance twice.
 * ------------------------------------------------------------------------------------------------- */

/** The stand-in when the park knows a ritual is borrowed but not from whom — a pre-409 save carries the
 *  echo without its source. One code path, not a second branch. */
export const ECHO_FROM_UNKNOWN = 'a friend';

/**
 * The book's line for a dino's ritual. `from` names who it was caught off (407); omit it (or pass null)
 * for a dino performing its own. `ECHO_FROM_UNKNOWN` renders the honest vaguer form.
 */
export function ticBookLine(t: Tic, from?: string | null): string {
  const own = `${t.glyph} ritual: ${t.label}`;
  if (!from) return own;
  return from === ECHO_FROM_UNKNOWN ? `${own} — picked up from a friend` : `${own} — caught off ${from}`;
}

/* ---------------------------------------------------------------------------------------------------
 * Not the only one (BACKLOG-416).
 *
 * Every beat this thread has added needed a **channel**. A sting starts a ritual (412). A friend near enough
 * to watch picks one up (407). The keeper walks over and catches one (408/413). The book names one (409).
 * This is the beat with no channel at all: two dinos, each far enough into its own solitude to have invented
 * a ritual, each near enough to see the other at it, and neither one crosses.
 *
 * The band is `watchingTic` — 407's, reused, not a second number. That is not thrift, it is the point: the
 * only distance at which this can happen is the distance at which a ritual can form *and* another dino is
 * visible, and 407 already had to name exactly that window for the opposite reason.
 *
 * **No bond floor, and no bond change.** 407 requires a real friend because you cannot learn a stranger's
 * ritual from across a field; you can absolutely feel less alone next to one. That asymmetry is the design.
 * This is the first thing in this park that two dinos share without knowing each other — no contact, no
 * bond moved, no word spoken, and nothing in the world to show for it but what each of them remembers.
 * ------------------------------------------------------------------------------------------------- */

/** The faint note each of two in-sight loners files. Names the other without calling them a friend — the
 *  whole beat is that they need not be one. */
export function kinshipMemory(other: string): string {
  return `you were not the only one out here — ${other} kept to its own ritual across the way`;
}

/** The ticker beat for the pairing. The new moon, because nothing happened — which is the beat. */
export function kinshipLine(a: string, b: string): string {
  return `\u{1F311} ${a} and ${b} keep to their own rituals, in sight of each other`;
}

/* ---------------------------------------------------------------------------------------------------
 * The ritual drifts (BACKLOG-421) — the tic gets a haunt.
 *
 * The item says the anchor "pins one tile". It does not, and the truth is the same failure seen from the
 * other side: `WorldScene` sets the anchor to wherever the wander happened to drop the dino, and `resetTic`
 * throws it away, so a dino that has taken up its ritual six times on one ground has performed it in six
 * unrelated places. Neither a pin nor a wander is a *habit*. A habit is a place you keep coming back to,
 * which moves a little each time you do.
 *
 * So the ritual gets a **haunt**: one remembered tile per (dino, ground), returned to and nudged one tile
 * every stretch performed there. Two rules carry the whole design:
 *
 * - The haunt **survives `resetTic`**. `ticAnchor` is per-stretch state; the haunt is what the dino knows
 *   about the ground. Clear it with the stretch and every stretch is a first stretch.
 * - The drift **never draws from `world/rng.ts`**. That stream is global and the e2e seeds it; a habit that
 *   reshuffles because some other dino rolled a wander step is not a habit. The direction comes from the
 *   dino's own name and its own drift count, so a reloaded park keeps the path it wore.
 *
 * Grief (414) still outranks all of this and deliberately does **not** touch the haunt: a dino pacing the
 * edge its friend left by is not keeping a habit, and the habit must be there to return to afterward.
 * ------------------------------------------------------------------------------------------------- */

/** A worn place: where a dino keeps its ritual on one ground, and how far the path has walked since it was laid. */
export interface Haunt {
  tileX: number;
  tileY: number;
  drifts: number;
}

/** dino → zone id → its haunt on that ground. Persisted (additive); absent → no haunts, every ritual a first. */
export type Haunts = Record<string, Record<string, Haunt>>;

/** How far a dino will walk back to its habit. Beyond this the old haunt is abandoned and the ground it is
 *  standing on becomes the new one — a habit you have wandered away from is a habit you have lost.
 *
 *  ponytail: raising this makes the walk-back long enough that a dino can spend a whole stretch travelling
 *  and never perform. If it ever needs to grow, give the walk-back its own step budget first. */
export const HAUNT_RETURN_RANGE = 6;

/** Drifts before the path has moved far enough to be worth remarking on — the beat that makes the drift
 *  legible instead of merely true. */
export const HAUNT_DRIFT_NOTED = 4;

/** Tile distance in the units a grid walk actually costs (Chebyshev — a diagonal is one step). */
export function hauntDistance(a: { tileX: number; tileY: number }, b: { tileX: number; tileY: number }): number {
  return Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY));
}

/** The eight neighbours a haunt can drift into — `ticStep`'s `circle` ring, with the diagonals. */
const DRIFT_RING: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

/** The dino's own die for its own path — name-seeded (010's `hashSeed`), never the world's shared stream. */
export function hauntSeed(name: string): number {
  return hashSeed(name);
}

/**
 * One tile of drift. Direction is drawn from the dino's seed mixed with the drift count, so the path
 * meanders rather than running in a straight line, and re-deriving it after a reload gives the same walk.
 * Clamped to the grid the same way `ticStep` clamps.
 */
export function driftHaunt(h: Haunt, seed: number, cols: number, rows: number): Haunt {
  const [dx, dy] = DRIFT_RING[Math.floor(mulberry32((seed + h.drifts * 0x9e3779b9) >>> 0)() * DRIFT_RING.length) % DRIFT_RING.length];
  const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi - 1, v));
  return { tileX: clamp(h.tileX + dx, cols), tileY: clamp(h.tileY + dy, rows), drifts: h.drifts + 1 };
}

/**
 * The one anchor decision the scene calls for a plain (non-grief) ritual: where this stretch is performed,
 * and what the dino's haunt on this ground becomes. Pure — the caller stores the haunt and fires the beat.
 *
 * No haunt, or a haunt further than `HAUNT_RETURN_RANGE` away, lays a fresh one where the dino stands —
 * which is byte-for-byte the pre-421 behaviour, so a dino's *first* stretch on a ground is unchanged.
 */
export function ticAnchorFor(args: {
  haunt: Haunt | undefined;
  at: Tile;
  seed: number;
  cols: number;
  rows: number;
}): { anchor: Tile; haunt: Haunt } {
  const { haunt, at, seed, cols, rows } = args;
  if (!haunt || hauntDistance(haunt, at) > HAUNT_RETURN_RANGE) {
    const fresh: Haunt = { tileX: at.tileX, tileY: at.tileY, drifts: 0 };
    return { anchor: { tileX: fresh.tileX, tileY: fresh.tileY }, haunt: fresh };
  }
  const next = driftHaunt(haunt, seed, cols, rows);
  return { anchor: { tileX: next.tileX, tileY: next.tileY }, haunt: next };
}

/** Has the path moved far enough to be worth noticing? */
export function hauntWorthNoting(h: Haunt): boolean {
  return h.drifts >= HAUNT_DRIFT_NOTED;
}

/** The one-time memory a dino files when its little path has visibly moved (the `ticMemory` register). */
export function hauntDriftMemory(label: string): string {
  return `your little path has wandered — you ${label} on ground you did not used to`;
}

/** The ticker beat for the same moment. The footprints, because the ground is what changed. */
export function hauntDriftedLine(name: string, glyph: string): string {
  return `${glyph} ${name}'s little path has worn its way across the ground`;
}

/* ── Glad of the company (BACKLOG-411) ────────────────────────────────────────────────────────────── */

/**
 * The other way a solitary stretch ends.
 *
 * Since 405 the tic has had five ways to *start* — plain idleness, a solitary day (393), a friendless new
 * ground (410), a fresh sting (412), a departed friend (414) — and exactly one ending anybody notices: the
 * keeper walking up (408/413/420/422). The far commoner ending is another dino wandering inside
 * `TIC_COMPANY_RANGE`, at which point `resetTic` tears the whole stretch down without a memory, a float, a
 * ticker line or a word. A dino that spent the last minute turning a slow circle by itself greeted you as
 * though it had not.
 *
 * So the ending gets a beat of its own: a mark, a memory naming who found it, one line on the ticker, and a
 * short-lived **warm trace** the dino leads its next greeting with. Free — no bond, no affinity, no
 * register that climbs. 422 priced the *keeper's* catch; this one is between two dinos.
 */

/** The float over a dino whose ritual was ended by company. Disjoint from the tic glyphs, the 408/413
 *  catch marks (😳/😊) and the feeding marks — a warmth of its own register. */
export const COMPANY_GLYPH = '🤗';

/**
 * How many world steps the warm trace stays worth leading with. Deliberately the same span
 * `STING_FADES_AFTER_STEPS` uses and deliberately *not* imported from it: a note that outlives the walk
 * back across the ground is a note the player cannot connect to anything they watched. Two separate claims
 * that happen to agree today.
 */
export const COMPANY_TRACE_FADES_AFTER_STEPS = 24;

/** Is the warm trace still worth leading with, given how many world steps have passed since it? */
export function companyTraceIsFresh(stepsSince: number): boolean {
  return stepsSince >= 0 && stepsSince < COMPANY_TRACE_FADES_AFTER_STEPS;
}

/**
 * Did a body end this stretch, or did a need? The whole ordering rule, in one place so the unit suite can
 * state it: a dino that walked off to the hatch was not *found* by anybody, and a stretch that never
 * reached the ritual was never a ritual to be pulled out of.
 */
export function foundByCompany(wasTiccing: boolean, hasPressingNeed: boolean): boolean {
  return wasTiccing && !hasPressingNeed;
}

/** The memory the found dino files — the ritual it was at, and who walked up. `ticMemory`'s register. */
export function gladOfCompanyMemory(label: string, friend: string): string {
  return `you ${label} until ${friend} came over — glad of the company`;
}

/** The ticker beat for the same moment (both names + the glyph), in `kinshipLine`'s shape. */
export function gladOfCompanyLine(name: string, friend: string, glyph: string): string {
  return `${glyph} ${friend} came over while ${name} was at its ritual`;
}

/**
 * The deterministic frame a freshly-found dino leads its next greeting with — `bashfulOpener`'s sibling,
 * prefixed to whatever the brain or the stub returned so it reads identically on a device with no model.
 * One constant line: there is no register here, on purpose (420's escalation is the keeper's, not a
 * friend's).
 */
export function gladOpener(friend: string): string {
  return `Glad you came by — ${friend} found me at it just now.`;
}
