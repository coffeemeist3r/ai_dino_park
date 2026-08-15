/**
 * The manner at the hatch (BACKLOG-402) — the contested-drop trio finally read. A yield (375/385), a
 * gobble (387), a stand (390) and a slink-off (394) each file their own memory string in `checkFeeding`,
 * and the collection book has never shown one of them. Folded here into a single character note: how
 * this dino behaves when two mouths want the same drop.
 *
 * Derived, never counted: like `foodwebStanding` (443) this reads the live 6-slot recall ring, so a
 * manner is *recent* behavior and no second tally is persisted. The memory strings are the interface —
 * they belong to WorldScene and feeding.ts, and this module adapts to them, never the other way round.
 */

export type TableManner = 'generous' | 'greedy' | 'unbowed' | 'timid';

export interface MannerTallies {
  generous: number;
  greedy: number;
  unbowed: number;
  timid: number;
}

// Each pattern captures the *other* dino's name in group 1 — `mannerTallies` only asks whether a beat
// happened, but `lastHatchOutcome` (404) has to name who it happened with, and one pattern per beat is the
// whole point of this module. The captures are byte-identical to `pecking.ts`'s `WEIGHTS` copies (401), so
// the two modules can never disagree about who a dino gobbled from.
const YIELDED = /^you stepped back and let (.+) eat first$/; // BACKLOG-375
const REPAID = /^you repaid (.+)'s kindness at the hatch$/; // BACKLOG-385 — repaying a meal is generosity too
const SNATCHED = /^you shouldered past (.+) and snatched the food first$/; // BACKLOG-387
const STOOD = /^you stood your ground and kept your food from (.+)$/; // BACKLOG-390
const SLUNK = /^(.+) wouldn't budge — you slunk off$/; // BACKLOG-394 — slunkOffMemory prefixes a name

/** How many of each contested-drop beat this dino currently carries. */
export function mannerTallies(memories: readonly string[]): MannerTallies {
  const t: MannerTallies = { generous: 0, greedy: 0, unbowed: 0, timid: 0 };
  for (const m of memories) {
    if (YIELDED.test(m) || REPAID.test(m)) t.generous++;
    else if (SNATCHED.test(m)) t.greedy++;
    else if (STOOD.test(m)) t.unbowed++;
    else if (SLUNK.test(m)) t.timid++;
  }
  return t;
}

/**
 * Ties break toward the rarer, more characterful read — and `timid` is last on purpose: a dino that
 * slunk off once and stepped back once is generous, not timid, because one lost contest is not a
 * character. One ordered list rather than a chain of ifs, so the rule is a line you can read.
 */
const PRECEDENCE: readonly TableManner[] = ['unbowed', 'greedy', 'generous', 'timid'];

/** This dino's table manner, or **null** when it has never contested a drop (then the book shows nothing). */
export function hatchManner(memories: readonly string[]): TableManner | null {
  const t = mannerTallies(memories);
  let best: TableManner | null = null;
  for (const m of PRECEDENCE) {
    if (t[m] === 0) continue;
    if (best === null || t[m] > t[best]) best = m;
  }
  return best;
}

const BLURB: Record<TableManner, string> = {
  generous: 'steps back so a friend eats first',
  greedy: 'shoulders in and takes the drop',
  unbowed: 'holds its ground and keeps its food',
  timid: "backs off when someone won't budge",
};

/**
 * The book's one-line read (BACKLOG-402), or null when there's no manner to show. The `at the hatch:`
 * prefix keeps 🍽️ from reading as the zone lens's feed-first *spend* policy (468) — same glyph, and
 * deliberately so: it is the plain feeding glyph in both places, about a dino here and a ground there.
 */
export function mannerLine(memories: readonly string[]): string | null {
  const m = hatchManner(memories);
  return m ? `🍽️ at the hatch: ${m} — ${BLURB[m]}` : null;
}

/**
 * Mealtime mood in the voice (BACKLOG-404) — the same ledger, read for **recency** instead of career.
 *
 * `hatchManner` above folds every contested beat a dino carries into one character note, and `pecking.ts`
 * (401) splits the same beats by opponent. Neither asks the question a *voice* wants answered: how did the
 * last meal go, and is the dino still carrying it. That is this — the latest contested beat on the ring, and
 * who it was with, handed to `mealtimeAside` (ai/brain.ts) to be said out loud.
 *
 * The 6-slot ring is the entire freshness gate. A mood speaks while its memory is still on the ring and goes
 * quiet on its own as the ring rolls — no timestamp, no second mechanism, and none of the 251 wart where a
 * spoken feeling became a permanent script.
 *
 * `REPAID` (385) is deliberately not an outcome: repaying a kindness later is generosity after the fact, not
 * a drop that was contested. It stays a `generous` tally for the book and nothing more.
 */
export type HatchOutcome = 'gobbled' | 'yielded' | 'stood' | 'slunk';

const OUTCOMES: readonly { re: RegExp; outcome: HatchOutcome }[] = [
  { re: SNATCHED, outcome: 'gobbled' },
  { re: YIELDED, outcome: 'yielded' },
  { re: STOOD, outcome: 'stood' },
  { re: SLUNK, outcome: 'slunk' },
];

/** The most recent contested-drop beat this dino carries, and who it was with — or null if it carries none.
 *  `remember` appends and keeps the last six, so the newest memory is the *last* element: scan backwards. */
export function lastHatchOutcome(memories: readonly string[]): { outcome: HatchOutcome; other: string } | null {
  for (let i = memories.length - 1; i >= 0; i--) {
    for (const { re, outcome } of OUTCOMES) {
      const hit = re.exec(memories[i]);
      if (hit) return { outcome, other: hit[1] };
    }
  }
  return null;
}
