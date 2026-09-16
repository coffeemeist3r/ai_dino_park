/**
 * Eavesdropping envy (BACKLOG-126) — somebody is always watching the good dinner.
 *
 * Milestone 20 spent four cycles giving the keeper's one repeated verb a consequence, and every one of
 * those consequences happened **inside one mouth**: 070 let a dino refuse what it was handed, 069 let the
 * book record what it swallowed, 068 let the keeper change what it wants. All three are a private
 * transaction between a keeper and an animal. There are four other dinos standing in that bowl and until
 * now not one of them has ever noticed who got fed.
 *
 * So: a dino that watches another get **the good dinner** — the food it was born loving, or (since 068)
 * a food the keeper has *made* it love — and that has almost no friendship of its own, files the thought
 * the item has carried since cycle 31: *the keeper likes them more*. The thought is not the payoff. The
 * payoff is that the next time the keeper walks over to say hello, it mentions it.
 *
 * **Envy is not a funk.** It wears no mark in the mark family, it blocks nothing, and it is not on the
 * `funks` seam (123/544), which holds one state at a time — putting envy there would silently evict a
 * sulk. A dino can be envious and sulking at once, which is the truthful arrangement.
 *
 * **And it lapses.** `sulk.ts` wrote this park's rule down: a permanent negative state is a defect. The
 * memory stays, because it is a memory and every memory stays; the *unsaid line* ages out.
 *
 * Pure (no Phaser, no clock, no randomness): Node-testable. The scene owns the record, the one write
 * site and the two read sites.
 */

/** Two hearts. Above this the dino is not insecure enough to be envious — the item's own gate. */
export const ENVY_POINTS_CEILING = 20;

/** Tiles between the watcher and the meal. Close enough to see the hatch from where it is standing. */
export const ENVY_WATCH_TILES = 5;

/**
 * How many `WANDER_STEP_MS` (3s) ambient steps an unsaid slight keeps: a hundred steps, **five minutes**.
 *
 * Longer than the sulk's forty (`SULK_FADES_AFTER_STEPS`) on purpose. A sulk is aimed at you and wants
 * beating on foot; this is something a dino only *overheard*, and it has to survive the keeper wandering
 * off to do something else, or the line never gets said. Shorter than the ten minutes CHARTER v7 measures
 * a feature over, so a player watching a fresh save sees it arrive **and** sees it lapse.
 */
export const ENVY_FADES_AFTER_STEPS = 100;

/** The watcher's one-frame tell. Not a mark-family member — `flashFeed`, like 😖/😤/🤝 before it. */
export const ENVY_GLYPH = '🥺';

/** One dino that could have seen the meal: its own standing with the keeper, and how far off it stood. */
export interface Watcher {
  name: string;
  /** player-friendship points. */
  points: number;
  /** distance from the meal, in tiles. */
  tiles: number;
}

/**
 * Who, if anyone, took the good dinner personally.
 *
 * Three gates, and the middle one is the item's whole sentence rather than a filter: `points <
 * eaterPoints` **is** "the keeper likes them more", written as arithmetic. Without it the park's own
 * favourite could be jealous of a stranger, which is not insecurity, it is bookkeeping.
 *
 * Fewest points wins — the most overlooked dino present, not merely the closest. Ties go to the nearest,
 * then to the lexicographically smallest name: `topBy`'s last resort, copied rather than re-invented,
 * because this codebase has one tie-break and a second that agreed today and drifted tomorrow is exactly
 * the defect BACKLOG-483 is filed over.
 */
export function enviousWitness(watchers: readonly Watcher[], eaterPoints: number): string | null {
  let best: Watcher | null = null;
  for (const w of watchers) {
    if (w.tiles > ENVY_WATCH_TILES) continue;
    if (w.points > ENVY_POINTS_CEILING) continue;
    if (w.points >= eaterPoints) continue;
    if (
      !best ||
      w.points < best.points ||
      (w.points === best.points && w.tiles < best.tiles) ||
      (w.points === best.points && w.tiles === best.tiles && w.name < best.name)
    ) {
      best = w;
    }
  }
  return best?.name ?? null;
}

/** Has an unsaid slight aged out, given how many ambient steps have passed since it was filed? */
export function envyHasFaded(stepsSince: number): boolean {
  return stepsSince >= ENVY_FADES_AFTER_STEPS;
}

/**
 * The thought itself — the item's literal phrase, kept word for word from the cycle-31 entry.
 *
 * A builder rather than a string at the call site, per BACKLOG-483: the book is a reader, and a reword
 * that silently empties a read is the failure that rule exists to stop.
 */
export function envyMemory(eater: string): string {
  return `the keeper likes ${eater} more`;
}

/** What it saw, filed beside what it concluded — the observation, so the book carries both halves. */
export function envySawMemory(eater: string, label: string): string {
  return `you watched the keeper give ${eater} the ${label}`;
}

/** The ticker line for the moment it happens. */
export function envyEventLine(watcher: string, eater: string, label: string): string {
  return `${ENVY_GLYPH} ${watcher} watched ${eater} get the ${label}`;
}

/**
 * The coloured greeting — the line the whole item exists for.
 *
 * It says hello *and then* says the other thing, in that order, because a dino that will not greet you
 * at all is sulking and this dino is not sulking. It is pleased you came and it would still like you to
 * know what it saw.
 */
export function wistfulGreetLine(name: string, eater: string): string {
  return `${name}: Oh — hello. ...you gave ${eater} the good one.`;
}
