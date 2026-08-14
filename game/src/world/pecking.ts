/**
 * Pecking-order memory (BACKLOG-401) — the hatch remembers *who*. Four cycles of contested-drop beats
 * (375 yield, 387 gobble, 390 stand, 394 slink-off) file memories that name the other dino, and until now
 * nothing read the name: the stand/cede call was `standsGround(bravery)` alone, identical against every
 * opponent forever, so a dino faced down by the same bully six times walked into the seventh unchanged.
 *
 * Here a dino's own memories become a running, *per-opponent* disposition — a little confidence toward one
 * it has faced down, a quiet wariness toward one that has out-grabbed it — which then decides the next
 * contest between exactly those two.
 *
 * Derived, never counted (the `manner.ts` / 402 discipline): this reads the live 6-slot recall ring, so a
 * disposition is *recent* history that fades as the ring rolls, and no second tally is persisted. The
 * memory strings are the interface — they belong to WorldScene and feeding.ts, and this module adapts.
 *
 * Split from manner on purpose: `manner.ts` folds every contested beat into one character note about the
 * dino; this reads the same beats *split by opponent*. Same source, orthogonal questions.
 */

import { GOBBLE_HUNGER, standsGround, WELL_FED } from './feeding';

export type Disposition = 'confident' | 'wary';

/**
 * The weights, as one table rather than a chain of ifs. Positive is confidence toward the named dino,
 * negative is wariness. A *yield* (375) is deliberately the lightest: stepping back for a hungry friend is
 * generosity, not fear, and must not read as being cowed — it only tilts, and only in numbers.
 */
const WEIGHTS: readonly { re: RegExp; weight: number }[] = [
  { re: /^you stood your ground and kept your food from (.+)$/, weight: 2 }, // 390
  { re: /^you shouldered past (.+) and snatched the food first$/, weight: 1 }, // 387
  { re: /^you stepped back and let (.+) eat first$/, weight: -1 }, // 375
  { re: /^(.+) wouldn't budge — you slunk off$/, weight: -2 }, // 394 (slunkOffMemory)
];

/**
 * Score at which a run of beats becomes a disposition. At 2 a single beat of any kind is never enough —
 * one lost contest is not a history — so a fresh park (and any dino with one beat on its ring) reads null
 * and behaves exactly as it did before this feature existed. The calibration knob; tune here.
 */
export const PECKING_BAR = 2;

/** How many beats with the same dino it takes before any of this is a *history* rather than one bad day.
 *  Held separately from the score on purpose: a single stand already weighs the bar, and a lone contest
 *  must not be a disposition. Two rules, each statable in a sentence, instead of one tuned constant. */
export const PECKING_MIN_BEATS = 2;

/** This dino's recent hatch history toward one named other: the net score, and how many beats produced it. */
export function peckingRead(memories: readonly string[], other: string): { score: number; beats: number } {
  let score = 0;
  let beats = 0;
  for (const m of memories) {
    for (const { re, weight } of WEIGHTS) {
      const hit = re.exec(m);
      if (hit && hit[1] === other) {
        score += weight;
        beats++;
        break;
      }
    }
  }
  return { score, beats };
}

/** How this dino's recent hatch history nets out toward one named other: >0 confident, <0 wary. */
export function peckingScore(memories: readonly string[], other: string): number {
  return peckingRead(memories, other).score;
}

/** This dino's standing disposition toward one named other, or **null** inside the dead band — or when
 *  they have only met over one drop, however that drop went. */
export function dispositionToward(memories: readonly string[], other: string): Disposition | null {
  const { score, beats } = peckingRead(memories, other);
  if (beats < PECKING_MIN_BEATS) return null;
  if (score >= PECKING_BAR) return 'confident';
  if (score <= -PECKING_BAR) return 'wary';
  return null;
}

/**
 * Does the winner hold its tile against this particular gobbler? With no disposition this is exactly
 * `standsGround(bravery)` — the pre-401 rule, imported rather than restated, so the unchanged path can
 * never drift. A dino that has faced this one down holds even below the bravery bar; one this dino has
 * lost to before cedes even above it. History outranks temperament, but only once there *is* a history.
 */
export function holdsAgainst(bravery: number, disposition: Disposition | null): boolean {
  if (disposition === 'confident') return true;
  if (disposition === 'wary') return false;
  return standsGround(bravery);
}

/** How many names each side of the book line will list. */
const BOOK_NAMES = 2;

/**
 * The book's pecking-order line (or null when this dino holds no disposition toward anyone). Names are
 * ranked by how strongly they read, capped at `BOOK_NAMES` a side, so the line stays one line as the ring
 * fills. `names` is the live roster — the only place a name can come from, so a departed dino's old
 * memories can't strand a stale name in the book.
 */
export function peckingLine(memories: readonly string[], names: readonly string[]): string | null {
  // Filtered through `dispositionToward` rather than the raw score, so the book can never name a
  // disposition the hatch itself wouldn't act on.
  const scored = names
    .map((n) => ({ name: n, score: peckingScore(memories, n), disp: dispositionToward(memories, n) }))
    .filter((s) => s.disp !== null);
  const faced = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, BOOK_NAMES)
    .map((s) => s.name);
  const wary = scored
    .filter((s) => s.score < 0)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, BOOK_NAMES)
    .map((s) => s.name);
  const parts: string[] = [];
  if (faced.length) parts.push(`faced down ${faced.join(' & ')}`);
  if (wary.length) parts.push(`wary of ${wary.join(' & ')}`);
  return parts.length ? `👊 pecking order: ${parts.join(' · ')}` : null;
}

/**
 * The berth (BACKLOG-389) — the disposition gets **feet**.
 *
 * 401 wired the per-opponent history into exactly one decision, at the last instant of an encounter: two
 * dinos already nose to nose over a drop, who holds and who cedes. Everything *before* that — whether a
 * dino walks over there at all — was `reactionToFood(energy, distance, favorite)`, blind to who else was
 * coming, so a dino out-grabbed by the same rival three times still trotted into the fourth losing
 * contest.
 *
 * Here it doesn't. Given the dinos already *nearer the food than this one* (the ones who will reach it
 * first), a dino that reads `wary` toward any of them gives that one a berth and stays out of the swarm.
 * The most feared name (most negative score) is the one it keeps clear of; exact ties go lexicographic,
 * the `topBy` convention this park uses everywhere a deterministic pick is needed.
 *
 * Filtered through `dispositionToward`, never the raw score — the `peckingLine` discipline: the feet can
 * never act on a history the hatch itself wouldn't act on, so one lost contest is not enough to keep a
 * dino from dinner.
 *
 * **Files no memory, on purpose.** The recall ring is six slots and this module *parses that ring* to
 * derive the disposition. A "you hung back" memory per declined drop would roll the very beats the
 * wariness is derived from off the end of the ring, and a dino that hung back twice would forget why. The
 * berth is behaviour and one ticker line; the ring is left alone.
 */
export function givesBerthTo(memories: readonly string[], nearer: readonly string[]): string | null {
  return (
    nearer
      .map((name) => ({ name, score: peckingScore(memories, name), disp: dispositionToward(memories, name) }))
      .filter((c) => c.disp === 'wary')
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))[0]?.name ?? null
  );
}

/**
 * Victor's mercy (BACKLOG-403) — the disposition gets **grace**.
 *
 * 389 read the `wary` end of the same per-opponent history and spent it on the approach: a dino that has
 * been shouldered aside hangs back. This reads the `confident` end and spends it at the drop. A dino that
 * faced a rival down here before, meeting that rival still hungry while itself well fed, steps off the
 * scrap and lets it eat — so defiance and grace live in the same dino, and *bold* stops being one thing.
 *
 * Agreeableness is the split, and it is the whole point: two dinos with identical hatch histories, both
 * bold enough to have won them, part company here. The magnanimous one gives way; the petty one takes its
 * winnings again.
 *
 * The bars are borrowed, never re-invented: `WELL_FED` is the same "doesn't need this meal" line the 375
 * yield uses, and `GOBBLE_HUNGER` is the same "hungry enough to shoulder in" line that made the rival a
 * gobbler in the first place. Calibrating the mercy against the beats it reads is what keeps it from
 * drifting away from them.
 *
 * Filtered through `dispositionToward` rather than the raw score (the `peckingLine` / `givesBerthTo`
 * discipline), so one won contest is not yet a history and a fresh park never reaches this at all.
 */
export const MERCY_AGREE = 0.55; // agreeableness at/above which a victor is magnanimous rather than petty

export function showsMercyTo(
  memories: readonly string[],
  winnerHunger: number,
  winnerAgreeableness: number,
  candidates: ReadonlyArray<{ name: string; hunger: number }>,
  winner?: string,
): string | null {
  if (winnerHunger > WELL_FED) return null; // it needs this meal itself
  if (winnerAgreeableness < MERCY_AGREE) return null; // a petty victor keeps its winnings
  return (
    candidates
      .filter((c) => c.name !== winner && c.hunger >= GOBBLE_HUNGER)
      .map((c) => ({ ...c, score: peckingScore(memories, c.name), disp: dispositionToward(memories, c.name) }))
      .filter((c) => c.disp === 'confident')
      .sort((a, b) => b.score - a.score || b.hunger - a.hunger || a.name.localeCompare(b.name))[0]?.name ?? null
  );
}

/**
 * The two sides of the mercy, as exported builders rather than literals at the call site (BACKLOG-483's
 * finding, applied to the strings this cycle writes). Neither is matched by any `WEIGHTS` regex above, on
 * purpose: a gift is not a defeat, so the mercy leaves both dinos' dispositions exactly as it found them —
 * the victor stays confident, the rival stays wary. A beat that rewrote its own input would make the
 * *second* mercy unreachable.
 */
export function mercyMemory(rival: string): string {
  return `you let ${rival} have the scrap this time`;
}

export function sparedMemory(victor: string): string {
  return `${victor} let you have the scrap this time`;
}

/** The hatch ticker line for a mercy, sharing `becauseOf`'s wording so the two branches can never phrase
 *  the same fact differently. */
export function mercyLine(victor: string, rival: string): string {
  return `🤲 ${victor} let ${rival} have the scrap${becauseOf('confident', rival)}`;
}

/** The because-clause appended to the hatch event line when history — not bravery — decided the contest.
 *  No silent change (CHARTER §Quality bar): if the disposition flipped the outcome, the ticker says so. */
export function becauseOf(disposition: Disposition, other: string): string {
  return disposition === 'confident' ? ` — it has faced ${other} down before` : ` — ${other} has beaten it here before`;
}
