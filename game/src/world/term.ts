/**
 * The seat has a term (BACKLOG-484).
 *
 * The council (479) is derived from live banked tallies, and until last cycle a seat was only a badge on the
 * lens and a line in the book — so deriving it on every read cost nothing. Then 481 gave the seats something
 * to *decide*, and the same property became a defect: `workPriorityFor` asks `councilFor` for an electorate
 * that changes on every harvest bank, so two callers within one step can get two different answers and a
 * ground's call can flip between ticks with nothing in the world marking that it happened.
 *
 * This gives the seating a **term**. The council is re-derived on the in-game day boundary — the cadence
 * spoilage (455), upkeep (480) and the discontent gate already run on — and *held* between, so a ground's
 * electorate changes on a date. A membership change lands one ticker beat.
 *
 * **It does not derive anything.** `zoneCouncil` stays the one comparator, reached through the `standings`
 * fold (482); this module only decides *when* it is asked and what changed since. Building a second
 * comparator here is precisely the failure 482 exists to prevent.
 *
 * **`null` is not `[]`.** `heldSeats` answers `null` for a ground with no held seating — "no term yet, read
 * live" — and `[]` for a ground that is held and seats nobody. Collapsing the two would make every ground on
 * a fresh save read as seating nobody until its first day boundary, taking 481's vote inert for a day, and
 * no existing spec would notice: a fresh park correctly seats nobody anyway.
 *
 * **The order is held too.** 481's tie-break is `votes[0]` and `zoneCouncil` orders most-banked first, so a
 * seating that froze membership but not order would leave the tie free to flip mid-term — the same defect
 * one layer down. Every reseat stores the fresh order, including the case where the membership is unchanged
 * and no beat fires.
 *
 * Pure TypeScript (no Phaser): Node-testable.
 */

/** A held seating: which ground seats whom, most-banked first, and the in-game day the term began. */
export interface Seating {
  seats: Record<string, string[]>;
  day: number;
}

/** What one ground's seats did at a re-derivation. `first` is a ground seated for the first time (not news);
 *  `turnover` is a membership change on a ground that already had one (the beat). */
export interface TermChange {
  zone: string;
  kind: 'first' | 'turnover';
  seated: string[];
  before: string[];
}

/** Does this ground have a held seating — and if so, who sits? `null` means "no term yet, read live". */
export function heldSeats(held: Seating | null, zone: string): string[] | null {
  const s = held?.seats[zone];
  return s ? [...s] : null;
}

/** Same seats, ignoring order — the membership test a turnover is judged on. */
export function sameSeats(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((n) => set.has(n));
}

/**
 * Hold a new term. Returns the seating to hold (always the **fresh** order for every ground, so the
 * tie-break stays honest) and one `TermChange` per ground whose seats actually moved.
 *
 * A ground whose membership is unchanged yields no change at all, however its order shifted; a ground held
 * for the first time yields `first`, which the caller records silently — the `checkCouncilCall` precedent,
 * where the first seating a ground ever holds is not news.
 */
export function reseat(
  held: Seating | null,
  fresh: Record<string, string[]>,
  day: number,
): { seating: Seating; changes: TermChange[] } {
  const changes: TermChange[] = [];
  for (const zone of Object.keys(fresh)) {
    const before = held?.seats[zone];
    const seated = fresh[zone];
    if (before === undefined) {
      if (seated.length) changes.push({ zone, kind: 'first', seated: [...seated], before: [] });
      continue;
    }
    if (!sameSeats(before, seated)) {
      changes.push({ zone, kind: 'turnover', seated: [...seated], before: [...before] });
    }
  }
  const seats: Record<string, string[]> = {};
  for (const zone of Object.keys(fresh)) seats[zone] = [...fresh[zone]];
  return { seating: { seats, day }, changes };
}

/**
 * The turnover beat (BACKLOG-484). Reuses 🗳️ — the council's existing mark, per the cycle-131 artist note
 * that this park's features collide in the glyph space. A ground that seats nobody after a turnover says so
 * rather than trailing off into an empty list.
 */
export function turnoverLine(zoneName: string, seated: readonly string[]): string {
  if (!seated.length) return `🗳️ the ${zoneName}'s council empties — nobody holds a seat now`;
  return `🗳️ the ${zoneName}'s council turns over: ${seated.join(', ')}`;
}
