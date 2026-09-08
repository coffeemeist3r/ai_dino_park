# Cycle 154 — Design

Two tracks. Both build on a seam somebody else already cut and left with no consumer.

---

## Lore track — BACKLOG-122: the homecoming streak

### The item, and the one place it must not be re-derived

> Returning on consecutive real days builds a "visit streak" surfaced on the plaque; miss a day and
> it resets.

"Real days" is the whole difficulty and it is already solved. `keeperclock.ts` exports `keeperDay()`,
built from local getters and **never** from `toISOString`, with a comment saying in as many words that
UTC "would call a weekday evening 'tomorrow' or 'yesterday' and hand BACKLOG-122's streak the wrong
day." **Nothing in this design may compute a calendar day any other way.** That includes the "is this
the day after that one" question, which is the second half of the same trap.

### The design

A new pure module `game/src/world/streak.ts`.

```ts
export interface Streak { last: string | null; run: number; best: number; }
export const NO_STREAK: Streak = { last: null, run: 0, best: 0 };
export function noteDay(prev: Streak, today: string): Streak
export function streakLine(s: Streak): string
```

`noteDay` has exactly three branches and they are the item's own sentence:

- `today === prev.last` → **the same Streak reference**, unchanged. A player who reloads the page
  eight times in an afternoon has visited once. Returning the same reference (the `spoilFood` /
  `runUpkeep` no-op contract this codebase already uses) lets the caller skip the save.
- `today` is the calendar day **after** `prev.last` → `run + 1`, `best = max(best, run + 1)`.
- anything else, including `prev.last === null` → `run = 1`, `best = max(best, 1)`.

**"The day after" is computed by adding 24 hours to the parsed local midnight of `prev.last` and
running the result back through `keeperDay`,** not by string arithmetic on `YYYY-MM-DD` and not by
`Date.parse` of the bare string (which is UTC in the spec). A DST day is 23 or 25 hours long; adding
24 hours to local midnight lands somewhere inside the next local day in both cases, and `keeperDay`
then names it. This is the one subtle line in the module and it gets its own test with a
timezone-independent construction: build the two days from `new Date(y, m, d)` and assert adjacency,
so the test passes in any CI timezone rather than only in one.

### Where the player sees it

`PlaqueStats` gains an optional `streak?: string`. Absent or empty renders **nothing** — every
existing plaque literal in the suite stays byte-identical, the `awayLogLines` precedent from last
cycle. `plaqueLines` appends `Keeper · <streak>` after the Zones line.

`streakLine` copy, and it is deliberately three registers rather than a number with a unit:

- `run === 1` → `first day`
- `run >= 2` → `<n> days running` (and, when `best > run`, ` · best <best>`)
- `run === 0` → `''` (the empty state, which only a save written before this cycle can be in)

### Persistence

Additive optional `streak?: Streak` on the save. Validation follows the `awayLog` shape: present and
malformed → reject the save (`null`), absent → `NO_STREAK`, so every pre-154 save restores and
immediately records its first day on the next boot.

Written in `recordVisit`, which is already the one function that asks the keeper's clock what time it
is on boot and is already called from both the fresh-save and restored-save paths. It gains one line.

### Dev hook

`__streak(s?)` — read the current streak, or set it, mirroring `__visitHours` exactly. This is what
lets an e2e spec put the keeper on day 4 without waiting four days, and it is the same seam
`__keeperNow` gives the hour. **`__keeperNow` is the honest one and the spec should use it where it
can**: set the keeper's clock to tomorrow, reload, and watch the streak go to 2 through production
code. `__streak` is for the states that take a week.

### Acceptance criteria — lore track

1. `noteDay` returns the **same reference** when the day is unchanged.
2. `noteDay` increments across a genuine calendar-day boundary, built with local date constructors so
   the test is timezone-independent.
3. `noteDay` resets to 1 across a gap of two or more days.
4. `best` never falls, and survives a reset.
5. Adjacency is correct across a DST boundary in a timezone that has one — skipped with a warning in
   a timezone that does not, the `keeperclock.test.ts` precedent.
6. `plaqueLines` with no `streak` is **byte-identical** to its pre-154 output.
7. A fresh save's plaque reads `Keeper · first day` (e2e).
8. Moving `__keeperNow` forward one day and reloading reads `Keeper · 2 days running` (e2e).
9. A save with a malformed `streak` is refused; a save with none restores and starts at day 1.
10. **The bar.** In a fresh save, watched for ten minutes: press P and the plaque carries a line about
    *you* — the first thing this park has ever counted that happens in the player's life rather than
    in the bowl's.

---

## Structure track — BACKLOG-536: the drain rate nobody measured (+ BACKLOG-530 riding)

### Part 1 — `groundBalance.ts`, the measurement

A pure module that states, per ground, what comes in against what goes out, **derived from the
production constants and never restating them** (reachability rule 1).

```ts
export interface Balance { inflow: number; outflow: number; surplus: number; }
export function dailyRolls(): number
export function inflowCeiling(): number
export function groundBalance(standing: number): Balance
export function solvent(standing: number): boolean
```

The derivation, which is the actual content of this item:

- **Rolls per in-game day.** `maybeSpawnResource` runs on the `WANDER_STEP_MS` pump. An in-game day
  at `ACTIVE_SCALE` is `MINUTES_PER_DAY / ACTIVE_SCALE` real minutes. `dailyRolls()` divides one by
  the other. `WANDER_STEP_MS` is currently a private const in `WorldScene`; **export it** (it is
  already surfaced as `__wanderStepMs`, so it is a published number wearing a private modifier).
- **The real ceiling is the yield, not the roll.** A pickup costs `YIELD_DEPLETE`, a tick restores
  `YIELD_REGROW`, so a ground can sustain one gather per `YIELD_DEPLETE / YIELD_REGROW` ticks
  regardless of how often the roll comes up. `inflowCeiling()` is `dailyRolls()` over that ratio.
  This is the number `upkeep.ts` has been implicitly promising and nobody has written down.
- **Outflow** is `upkeepDue(standing)` — the production function, called, not re-implemented.

`groundBalance` deliberately reports the **ceiling**, not an expectation. Real inflow is gated by
`RESOURCE_SPAWN_CHANCE`, by whether anyone is awake (524), by whether a dino walks to the resource,
and by `STOCKPILE_CAP`. A ceiling is the honest thing a pure module can assert: *if even the ceiling
were under the bill, the ground would be structurally insolvent and no amount of luck would save it.*
The module's header must say this rather than let a later reader mistake the number for a forecast.

### Part 2 — the register claim, and what the Designer expects it to say

One new `REACHABILITY_REGISTER` entry, id `BACKLOG-536`:

- **founded frame:** every founding ground is solvent at its founding skyline.
- **played frame:** the Grove after its cairn is mended — the two-landmark skyline cycle 152 shipped
  — is still solvent. `afterOneSession()` already models a played park; the entry hangs off it.

The Structure-smith's stated expectation is that this holds by a wide margin and that the finding runs
the *other* way: the drain is negligible against the ceiling. **If that is what the numbers say, the
Coder ships the measurement and does not invent a tuning pass to make the result dramatic.** A green
claim that nobody could previously have made is the deliverable. The verdict should record the actual
ratio, because that number is the item's real output and the next cycle that touches
`STRUCTURES_PER_UPKEEP` will want it.

### Part 3 — the readout, which is the reachability answer

`PlaqueStats` gains an optional `upkeep?: string`; absent/empty renders nothing (same additive rule
as `streak`). `plaqueLines` appends `Upkeep · <upkeep>` after Stores.

Content, from a new `upkeepLine(due)` in `upkeep.ts` (beside the function that computes the bill, not
in the UI): `🛠️ 1/day`, and when `due === 0`, `''` — a ground that owes nothing says nothing, so the
bowl and the frontier are unchanged. On the Grove after the first-minute mend this reads `🛠️ 1/day`,
which is the first time the player is told the rate rather than handed the result twenty-four real
minutes later.

The line is about the **active** ground, like every other plaque line: `refreshPlaque` passes
`upkeepDue(standing in this.zoneId)`.

### Part 4 — BACKLOG-530, the rider

`__marks()` returning `Record<string, string[]>` — dino name to the mark keys currently **visible**.
Built by reading `.visible` off the production mark objects themselves, which is the item's own
requirement ("built off the same `refresh*Marks` reads production uses, not a parallel calculation")
satisfied by construction rather than by discipline. One table:

```
sleep · rouse · vigil · missed · mend · cold · mope · need · activity
```

Then the precedence claims each family already makes in its comments, turned into specs:

- an owl that is also the vigil keeper wears `vigil` and **not** `rouse` (`refreshRouseMarks`' own
  comment);
- a graded dino that is also resting wears `sleep` and **not** `missed` (`refreshMissedMarks`' own
  paragraph, which explicitly says the plainer criterion is false);
- `sleep` and `rouse` never co-occur (mutually exclusive by construction).

**And the sixth member.** There is no `refreshMendMarks`, which is why BACKLOG-537 is held. Add it,
in the shape of its siblings: a `mendMarks` array, visible when `this.mend?.fixer === d.name` and the
dino is in view, positioned like the rest, called from the same chain. It sits **below** the vigil and
**above** the missed thought, by the family's own stated principle — what a dino is *doing* beats what
it is *thinking*, and a dino on a mend errand is not standing at the glass. It renders the existing
`MEND_GLYPH` until an Artist fire draws it a rig, exactly how every other mark in this family started.

### Acceptance criteria — structure track

1. `dailyRolls()` is derived from `WANDER_STEP_MS`, `MINUTES_PER_DAY` and `ACTIVE_SCALE` — no literal
   restates any of them.
2. `inflowCeiling()` is derived from `YIELD_DEPLETE` / `YIELD_REGROW`.
3. `groundBalance(standing).outflow` equals `upkeepDue(standing)` for standing 0..8, by calling it.
4. `solvent()` is true for every founding ground's skyline, and the test states the ratio.
5. A hypothetical ground whose skyline exceeds the ceiling reads **insolvent** — the predicate can
   actually fail, which is the difference between a claim and a comment.
6. The new register entry holds in **both** frames; `darkEntries()` stays empty.
7. `plaqueLines` with no `upkeep` is byte-identical to its pre-154 output.
8. `upkeepLine(0)` is `''`.
9. `__marks()` reports a resting dino as wearing `sleep`, through the production objects.
10. The three precedence claims above hold as specs.
11. `refreshMendMarks` shows a mark over the dino currently carrying a mend, and only that dino.
12. **The bar.** In a fresh save, watched for ten minutes: cross to the Grove, press P, and the plaque
    names what the ground owes per in-game day. That number has been billed since cycle 152 and the
    player has never been shown it.

---

## Collision note

Both tracks land in `plaque.ts` and `WorldScene.refreshPlaque`. This is deliberate and safe: two
independent optional fields on `PlaqueStats`, appended in a fixed order (`Upkeep`, then `Keeper`
last), each rendering nothing when absent. Neither track may change an existing line.
