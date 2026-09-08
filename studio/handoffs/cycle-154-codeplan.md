# Cycle 154 — Code Plan

## Reuse audit (run before writing anything)

| Need | Prior art | Call |
|---|---|---|
| the keeper's calendar day | `world/keeperclock.ts` → `keeperDay(ms)`, `getKeeperClock().day()` | **call it**; never build a day string anywhere else |
| injectable now for tests | `setKeeperNowSource` / `resetKeeperClock` | call |
| a no-op that returns the same reference | `runUpkeep` / `spoilFood` contract | mirror |
| what a ground owes | `world/upkeep.ts` → `upkeepDue(standing)` | **call it**; do not re-derive `floor(n/2)` |
| in-game day length in real time | `world/clock.ts` → `MINUTES_PER_DAY`, `ACTIVE_SCALE` | import |
| yield economics | `world/regrowth.ts` → `YIELD_DEPLETE`, `YIELD_REGROW` | import |
| the sim pump period | `WorldScene` `WANDER_STEP_MS` (private) | **export it**, then import |
| a played-park frame | `world/reachability.ts` → `afterOneSession()` | reuse for the register entry |
| optional plaque line that renders nothing | `plaqueLines` `stockpile` / `zoneTally` | mirror the pattern exactly |
| additive optional save field + validation | `awayLog` in `saveGame.ts` (cycle 153) | mirror |
| a read/write dev hook | `__visitHours` in `WorldScene` | mirror |
| a mark refresh function | `refreshVigilMarks` | mirror for `refreshMendMarks` |
| DST-conditional test that skips cleanly | `tests/unit/keeperclock.test.ts` | mirror |

**The one thing the audit says NOT to reuse.** `fmtSpan` and anything else in `away.ts`. Last cycle's
finding stands and applies twice as hard here: those measure **in-game** units and every number in
122 is wall-clock. Nothing in `streak.ts` may import from `away.ts`.

---

## Lore track — BACKLOG-122

### New files

**`game/src/world/streak.ts`** — pure, no Phaser, no `Date.now()`.

- `export interface Streak { last: string | null; run: number; best: number }`
- `export const NO_STREAK: Streak`
- `function nextDay(day: string): string` — private. Parse `YYYY-MM-DD` into local components with
  `new Date(y, m - 1, d)`, add `24 * 3600 * 1000`, hand back through `keeperDay`. **Not** `Date.parse`
  (UTC), **not** string arithmetic.
- `export function noteDay(prev, today): Streak` — three branches per the design; same reference on
  the same-day case.
- `export function streakLine(s): string` — `''` / `first day` / `N days running` (+ ` · best M` when
  `best > run`).

**`tests/unit/streak.test.ts`** — criteria 1–5. The adjacency test builds both days with
`new Date(y, m, d)` so it is timezone-independent; the DST test mirrors `keeperclock.test.ts`'s
warn-and-skip when the runner's zone has no transition.

### Edits

- `game/src/ui/plaque.ts` — `PlaqueStats.streak?: string`; `plaqueLines` pushes `Keeper · ${s.streak}`
  when truthy, **after** the Upkeep line the structure track adds. One line each.
- `game/src/world/saveGame.ts` — `streak?: Streak` on the interface; validation block beside
  `awayLog`'s: absent → undefined, present-and-malformed → `return null` (check `last` is
  `string | null`, `run`/`best` are numbers).
- `game/src/scenes/WorldScene.ts`:
  - field `private streak: Streak = NO_STREAK;`
  - `recordVisit` gains `this.streak = noteDay(this.streak, getKeeperClock().day());`
  - restore path: `this.streak = save.streak ?? NO_STREAK;` **before** `recordVisit(save.visitHours)`
    — order matters, the restore has to land before the day is noted.
  - `saveState`: `streak: this.streak,`
  - `refreshPlaque`: `streak: streakLine(this.streak),`
  - dev hook `__streak` mirroring `__visitHours` (no arg → read a copy; arg → set + refresh plaque).

### e2e

`tests/e2e/cycle-154-streak.spec.ts`, declaring its founding state via `foundingState(page, …)` per
BACKLOG-495 — criteria 7 and 8. Criterion 8 drives it through production: `__keeperNow` to tomorrow,
reload, read the plaque.

---

## Structure track — BACKLOG-536 (+ 530)

### New files

**`game/src/world/groundBalance.ts`** — pure.

```ts
export function dailyRolls(): number     // (MINUTES_PER_DAY / ACTIVE_SCALE) * 60_000 / WANDER_STEP_MS
export function inflowCeiling(): number  // dailyRolls() / (YIELD_DEPLETE / YIELD_REGROW)
export function groundBalance(standing: number): Balance
export function solvent(standing: number): boolean   // groundBalance(standing).surplus >= 0
```

Header must state, in the module's own words, that `inflow` is a **ceiling and not a forecast** —
real inflow is additionally gated by `RESOURCE_SPAWN_CHANCE`, by `wakingIn` (524), by a dino actually
walking to the resource, and by `STOCKPILE_CAP`. The claim the ceiling supports is one-directional:
a skyline above it is insolvent no matter how the dice fall; one below it is *not thereby* solvent in
practice. Say so, or a later reader will read the number as a forecast.

**`tests/unit/groundBalance.test.ts`** — criteria 1–5. Criterion 1's "no literal restates a constant"
is asserted by computing the expected value from the imported constants in the test too, and
criterion 5 by passing a standing large enough to exceed the ceiling.

### Edits

- `game/src/scenes/WorldScene.ts` — `const WANDER_STEP_MS` becomes `export const WANDER_STEP_MS`.
  (It is module-scope, not a class field. `__wanderStepMs` already publishes it.)
  - **Watch for an import cycle**: `groundBalance.ts` importing from `WorldScene.ts` would pull Phaser
    into a pure module and break Node testability. **Move `WANDER_STEP_MS` to `world/clock.ts`** and
    re-import it in `WorldScene` instead. It is a time constant and that is where the park's other
    time constants live. This is the correct fix, not a workaround.
- `game/src/world/upkeep.ts` — `export function upkeepLine(due: number): string` returning `''` for
  `due <= 0`, else `` `${UPKEEP_GLYPH} ${due}/day` ``. Beside `upkeepDue`.
- `game/src/world/reachability.ts` — one new entry, id `BACKLOG-536`, `system` in the bar's register,
  `fact` naming the founding skyline, `holds` calling `solvent(...)` over `FOUNDING_LANDMARKS`
  grouped by zone, `played` calling it over `afterOneSession()`'s Grove skyline. Routed through
  production functions per the file's rule 1.
- `game/src/ui/plaque.ts` — `PlaqueStats.upkeep?: string`; pushed after Zones, before Keeper.
- `game/src/scenes/WorldScene.ts` `refreshPlaque` — `upkeep: upkeepLine(upkeepDue(standingIn(this.zoneId)))`.
  Reuse whatever the scene already uses to count standing landmarks in a zone for the upkeep pass; do
  **not** write a second counter. Find it before writing it.

### Rider — BACKLOG-530

- `WorldScene`: `private mendMarks: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Image> = [];`
  created wherever `vigilMarks` is created, torn down wherever it is torn down.
- `private refreshMendMarks(): void` — mirror `refreshVigilMarks`: visible when
  `this.mend?.fixer === d.name && this.inView(d)`, positioned `d.y - TILE`. Called at the **end of
  `refreshVigilMarks`**, and `refreshMendMarks` then calls `refreshMissedMarks` (taking over that
  call), which puts it in the chain exactly at its precedence position.
- `refreshMissedMarks`'s `higher` gains `|| this.mend?.fixer === d.name`, and its doc paragraph gains
  the sixth member. **This is a behavior change to an existing mark and must be stated in the QA
  handoff** — a dino on a mend errand no longer shows a missed thought.
- `__marks()` dev hook: one local table `[['sleep', this.sleepMarks], ['rouse', this.rouseMarks],
  ['vigil', this.vigilMarks], ['mend', this.mendMarks], ['missed', this.missedMarks],
  ['cold', this.coldMarks], ['mope', this.mopeMarks], ['need', this.needMarks],
  ['activity', this.activityMarks]]`, mapped per dino index to the keys whose object `.visible` is
  true. Reads the production objects — no recomputation anywhere in the hook.
- `tests/e2e/cycle-154-marks.spec.ts` — criteria 9–11, via `__marks()`.

---

## Order of work

1. Move `WANDER_STEP_MS` to `clock.ts`, build, confirm green. (Touches one import; do it alone.)
2. `streak.ts` + its unit test.
3. `groundBalance.ts` + its unit test.
4. `upkeepLine` + register entry + register test stays green (`darkEntries()` empty).
5. `plaque.ts` — both optional fields in one edit, with the byte-identical assertions (criteria 6, 7).
6. `WorldScene` wiring for both tracks + save + hooks.
7. `refreshMendMarks` + `__marks()`.
8. e2e for both tracks.

## Blockers

None. Build clean, 2573 unit green across 245 files, e2e 684/1 with the failure at `boot` in
`cycle-123-wandering` — the BACKLOG-538 signature exactly, green on an isolated re-run (6/6).

## Shipped

**New:** `game/src/world/streak.ts`, `game/src/world/groundBalance.ts`,
`tests/unit/streak.test.ts`, `tests/unit/groundBalance.test.ts`,
`tests/e2e/cycle-154-streak.spec.ts`, `tests/e2e/cycle-154-marks.spec.ts`,
`tests/e2e/cycle-154-upkeep-line.spec.ts`.

**Edited:** `world/clock.ts` (`WANDER_STEP_MS` moved in), `world/upkeep.ts` (`upkeepLine`),
`world/mending.ts` (`MEND_ART_KEY`), `world/reachability.ts` (entry + placed prop),
`world/saveGame.ts` (`streak`), `ui/plaque.ts` (two optional lines),
`scenes/WorldScene.ts`, `tests/unit/plaque.test.ts`.

### Deviations from the plan, and why

**1. `plaqueStats()` was extracted, which the plan did not ask for.** Adding the two lines to
`refreshPlaque` surfaced that `__plaque` was a hand-copied duplicate of the same six fields — so the
dev hook every plaque spec in this suite reads would have gone on reporting the pre-154 plaque while
the brass showed two more lines, and nothing would have failed. That is BACKLOG-495's defect sitting
inside the test seam itself. Both now read one `plaqueStats()`. Three lines net, and it is the
difference between a hook that observes the plaque and a hook that resembles it.

**2. `__marks()` refreshes before it reads, and reports `offscreen`.** Two findings from the first
run of its own spec, both worth keeping. The family is redrawn on the world step, so a pure read
reports whatever the last frame left behind rather than the state the spec just arranged — the hook
now drives `refreshSleepMarks()` first, the `__stepMend` precedent. And every mark in the family is
`inView`-gated, so a dino on another ground wears nothing *by design*; returning `[]` for it made
"not shown" and "not here" the same answer, which is the exact ambiguity this item was filed over.
A dino off the keeper's ground reports `['offscreen']`.

**3. `__recordVisit` was added.** The streak's increment lives in `recordVisit`, which only runs on
boot. Without a hook, the two-consecutive-days spec would have had to set the streak itself and then
assert about the value it set. It now moves `__keeperNow` and re-runs the production read.

**4. No tuning pass, as the design instructed.** The numbers: **480 sim pumps per in-game day**, a
ground can cash one gather per **17** of them, so the ceiling is **~28.2 units per in-game day**
against a Grove bill of **1**. The affordable skyline is **57 landmarks**. Every founding ground is
solvent by a factor of twenty-eight and the finding runs the other way — the yield regrowth is the
binding constraint and `RESOURCE_SPAWN_CHANCE` is not, which means a future cycle reaching for more
resources by raising the spawn chance would be turning the wrong knob. Written into the module header
rather than left in this file.
