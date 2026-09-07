/**
 * The away-log (BACKLOG-114) — the book keeps what the bowl got up to while you were gone.
 *
 * The homecoming digest is the only thing this park ever says about *you*, and since cycle 149 it has grown
 * four separate authors: the warm pairs (106), the pair that drifted (113), the spoilage and upkeep tail
 * (462/480), and the per-dino accounts that hang over heads on return (116). All four write into one modal
 * that the next keypress destroys, with no record anywhere. The book already keeps everything else this
 * park knows — a dino's quirk, its ritual, its hours, its dreams, its parents — permanently, through saves.
 * This is the one thing it did not keep.
 *
 * Three entries, not one. The item asks for "the last digest"; the reason to keep more is that the digest's
 * *content* now varies with the gap — five minutes says one thing, a day says another — so a log with one
 * entry is a mirror of the modal rather than a record. Three is the smallest number that shows the news
 * changing.
 *
 * Pure (no Phaser, no `Date`): the scene stamps the entry, this decides what is kept and how it reads.
 */

/** One return, as the book keeps it. */
export interface AwayEntry {
  /** Wall-clock ms at the moment of return — when this happened to *you*. */
  at: number;
  /** The in-game span the digest is about — how long the park was alone. A different number from `at`,
   *  and the two are easy to confuse: one is your afternoon, the other is the bowl's. */
  minutes: number;
  /** The digest, exactly as the modal showed it. */
  lines: string[];
}

/** How many returns the book keeps. */
export const AWAY_LOG_KEPT = 3;

/**
 * Prepend a return, newest first, keeping at most `AWAY_LOG_KEPT`.
 *
 * An entry with nothing in it is **not kept**: an absence the park had no news about should never push a
 * real one off the end of a three-slot log.
 */
export function keepAwayLog(prev: AwayEntry[], entry: AwayEntry): AwayEntry[] {
  if (!entry.lines.length) return prev;
  return [entry, ...prev].slice(0, AWAY_LOG_KEPT);
}

/** The divider between one return and the one before it. */
const SEP = '  ·';

export const AWAY_LOG_HEADING = '— While you were away —';

/**
 * The block the book shows, newest return first.
 *
 * An empty log renders **nothing at all** — not a heading over blank space — so a park nobody has ever left
 * shows a book that looks exactly as it always did.
 *
 * There is deliberately no "how long ago" stamp, and no second span formatter. The digest's own first line
 * already says how long the bowl ran on, in `away.ts`'s words, so a stamp here would be the same fact
 * written down twice — and `fmtSpan` measures *in-game* minutes against an in-game day, which is not the
 * unit an "ago" is in. Ordering carries the rest: newest first, dividers between.
 */
export function awayLogLines(log: AwayEntry[]): string[] {
  if (!log.length) return [];
  const out: string[] = [AWAY_LOG_HEADING];
  log.forEach((e, i) => {
    if (i) out.push(SEP);
    for (const l of e.lines) out.push(`  ${l}`);
  });
  return out;
}
