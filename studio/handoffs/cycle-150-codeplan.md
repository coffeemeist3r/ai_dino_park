# Cycle 150 — Code Plan

**Build order: structure track first, then lore track.** Both edit `WorldScene.ts`; the lore
track's catch-up work must be written against the keeper-clock seam, not around it.

---

## Structure track — BACKLOG-529: the keeper's own clock is not the park's

### Files to create

- `game/src/world/keeperclock.ts` — the seam.
- `tests/unit/keeperclock.test.ts` — the three answers, pinned.

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - `checkVigil()` — `new Date().getHours()` → `getKeeperClock().hour()`.
  - `recordVisit()` — same substitution.
  - dev hooks block (beside `__visitHours`, line ~1679) — add `__keeperNow(ms?)`: with an
    argument, `setKeeperNowSource(() => ms)`; with none, return the current reading
    `{ ms, hour, day }`.
- `game/src/world/away.ts` — header comment only: `savedAt` arithmetic is a **duration**,
  timezone-free and correct; an hour-of-day is a different kind of reading and lives in
  `keeperclock.ts`.
- `tests/e2e/cycle-149-vigil.spec.ts` — the third test currently derives its "far" hour from a
  bare `new Date().getHours()` in the spec, which is the same coin-flip the seam exists to
  remove. Rewrite it to set the keeper's hour through `__keeperNow` and derive `far` from
  `__visitHours()`. **This is the one existing spec allowed to change**; QA names it.

### Module shape

```ts
export function keeperHour(nowMs: number): number      // 0..23, local
export function keeperDay(nowMs: number): string       // 'YYYY-MM-DD', local
export function setKeeperNowSource(fn: () => number): void
export function getKeeperClock(): { hour(): number; day(): string; now(): number }
```

Default source is `() => Date.now()` — and that call is the **only** `new Date` / `Date.now`
hour-read in `game/src` outside tests. `keeperDay` builds its string from
`getFullYear/getMonth/getDate` (local getters), never `toISOString`, which is UTC and would
silently hand BACKLOG-122 the wrong day for half the planet's evening.

### Reuse list

- `game/src/world/clock.ts` — copy its **shape** (module-level singleton + injectable now-source
  + a `get*Clock()` accessor), not its content. This module is the sibling, and reading like one
  is the point.
- `game/src/world/vigil.ts` — `VISIT_HISTORY_MAX`, `noteVisit`, `isAnticipating` unchanged and
  reused as-is. No behaviour moves into the new module.
- Existing dev-hook conventions (`__clockNow`, `__advanceWall`) — `__keeperNow` mirrors them.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/keeperclock.test.ts`**

1. `keeperHour` for two injected epochs twelve hours apart returns two hours twelve apart (mod 24).
2. **DST fall-back**: two epochs one hour apart that yield the same local hour both return that
   hour, and `noteVisit(noteVisit([], h), h)` records both. Build the pair by scanning a real
   local-DST boundary rather than hardcoding one, and **skip with a stated reason when the test
   machine's zone has no DST** — a CI box on UTC must not silently pass an assertion about a
   transition it cannot have.
3. **Spring-forward**: the skipped hour is simply never returned by `keeperHour` for any epoch in
   that day; the visit history is unchanged. Same scan, same skip.
4. `keeperDay` differs across a local midnight and is stable either side of it.
5. `setKeeperNowSource` is honoured by `getKeeperClock().hour()`.

**E2E — `tests/e2e/cycle-149-vigil.spec.ts` (rewritten third test)**

- Set `__keeperNow` to an epoch whose local hour equals the park's learned visit hour → a vigil
  dispatches. Set it twelve hours away → none. Both hours **derived** from `__visitHours()`.

### Risks

- `keeperDay`'s only consumer is BACKLOG-122, next cycle. If the Coder finds it awkward to test
  with no caller, test it directly — do **not** delete it and do not invent a caller for it.
- The DST tests are environment-dependent. The skip-with-reason branch above is mandatory, not
  optional; a test that silently no-ops in CI is worse than no test.

### Estimated touch count

~5 files.

---

## Lore track — BACKLOG-116: missed-you memory

### Files to create

- `game/src/world/missed.ts` — grades, builders, thresholds, glyph/art key.
- `tests/unit/missed.test.ts` — the grade derivation and the founding-spread claim.
- `tests/e2e/cycle-150-missed.spec.ts` — the threshold, the marks, the greet.

### Files to modify

- `game/src/scenes/WorldScene.ts`
  - fields: `missedMarks: Array<Text | Image>`, `missedTrace: Record<string, { grade: MissedGrade; at: number }>` (session-only, never saved).
  - `spawnDino()` — `this.missedMarks.push(this.makeHourMark(MISSED_ART_KEY, MISSED_GLYPH))`,
    beside the vigil's push, so born dinos get one too.
  - `refreshVigilMarks()` — call `this.refreshMissedMarks()` at its end, continuing the existing
    chain. New method: visible when the dino holds an unexpired trace, `inView`, **and** is not
    already showing a sleep / rouse / vigil mark — the bottom of the precedence order. `aloof`
    draws the same mark at `MISSED_FAINT_ALPHA`; `missed` at full alpha.
  - a private `applyMissed(minutes)` called from **both** catch-up sites (the DB-restore block
    ~8214 and `__catchUp` ~8265, immediately after the `homecoming(...)` line so the two beats
    read the same restored friendship): grade every dino, `remember(...)` the memory, stamp the
    trace at `this.worldSteps`.
  - `stepWorld` (the `this.worldSteps++` site, ~4891) — expire traces older than `MISSED_MARK_STEPS`.
  - `pickTone()` — third opener grade after `caught` / `glad`: `missedOpener(grade)` when the
    target holds a live trace, and delete the trace (it is consumed by this one line, exactly as
    `companyTrace` is).
  - dev hooks — `__missedYou()` returning `{ [name]: grade }` from the live trace map, and
    `__missedMarks()` returning `{ name, visible }` per dino read off the **sprites**.

### Module shape

```ts
export type MissedGrade = 'missed' | 'aloof' | 'unmoved';
export const MISSED_MIN_MINUTES = 5;
export const NOTICE_SOCIABILITY, NOTICE_CURIOSITY, NOTICE_BAR: number;
export const WARM_BAR, HEART_LIFT: number;
export const MISSED_GLYPH = '💭'; export const MISSED_ART_KEY = 'missed';
export function missedGrade(p: Personality, hearts: number): MissedGrade
export function missedMemory(grade: MissedGrade): string
export function missedOpener(grade: MissedGrade): string
export function missedYou(cast: ReadonlyArray<{name: string; traits: Personality; hearts: number}>, minutes: number): Record<string, MissedGrade>
```

`missedYou` returns `{}` below `MISSED_MIN_MINUTES` and omits `unmoved` dinos from the map
entirely — the absence *is* the grade, and a consumer that has to filter for it will one day
forget to.

**Constant-fitting is expected work, not a shortcut.** `NOTICE_BAR` and `WARM_BAR` must be chosen
so the founding Bowl produces all three grades at zero friendship (the design's second criterion
and CHARTER v7's corollary). Derive them by printing the roster's five personalities and picking
bars with visible margin either side — `chronotype.ts`'s own header is the precedent for how much
margin to want and for writing the rejected alternative down.

### Reuse list

- `game/src/ai/personality.ts` — `Personality`. Traits are name-seeded; never re-derive them here.
- `game/src/social/friendship.ts` — `heartsFromPoints`, the same hearts grade `homecoming.ts` uses.
- `game/src/ai/memory.ts` — `remember` / `recall`. No new store.
- `game/src/world/away.ts` — `AwayResult.minutes` is the input. Do not recompute the gap.
- `WorldScene.makeHourMark` — the mark. Do not hand-roll a Text.
- `WorldScene.companyTrace` + `companyTraceIsFresh` — the exact precedent for a session-only,
  step-stamped, consumed-by-one-greeting trace. Follow it; do not invent a second pattern.
- `game/src/world/vigil.ts` — the glyph/art-key-declared-together shape.

### New dependencies

none.

### Test plan

**Unit — `tests/unit/missed.test.ts`**

1. `missedGrade` is pure: identical inputs → identical grade, over a table of synthetic personalities.
2. Each of the two axes moves the grade independently: dropping sociability below the notice bar
   forces `unmoved` regardless of agreeableness; raising agreeableness across `WARM_BAR` moves
   `aloof` → `missed`.
3. `hearts` alone can move `aloof` → `missed` for a fixed personality.
4. **The founding spread**: build the founding Bowl's residents from the roster, grade them all at
   zero friendship, and assert `new Set(grades).size === 3`. Derived — the spec reads the roster,
   names no dino, and fails loudly if a future roster or trait change collapses the spread.
5. `missedMemory` / `missedOpener` return distinct non-empty strings per grade, and nothing for
   `unmoved`.
6. `missedYou` returns `{}` below the threshold and omits `unmoved` at and above it.

**E2E — `tests/e2e/cycle-150-missed.spec.ts`**

1. **Threshold, both sides.** `__catchUp(4 * 60 * 1000)` → `__missedYou()` empty.
   `__catchUp(5 * 60 * 1000)` → non-empty.
2. **The marks are drawn.** After the crossing catch-up, every name in `__missedYou()` has
   `visible: true` in `__missedMarks()`, and every cast member absent from `__missedYou()` has
   `visible: false`. Names derived from the hooks, never listed.
3. **The greet consumes it.** Walk to a graded dino, greet it, pick a tone; the dialog text starts
   with that grade's opener, and `__missedMarks()` then reports it invisible.
4. **It expires.** After the catch-up, drive `__stepWorld` past `MISSED_MARK_STEPS` without
   greeting; the mark goes invisible on its own.
5. **No stacking.** A dino forced mid-tic (`__formTic`) and then greeted shows the caught opener,
   not the missed one, even while holding a trace.

### Risks

- **`__catchUp` runs the homecoming too.** The nuzzle's own threshold is 360 minutes, so a
  5-minute catch-up produces a missed trace and no nuzzle — which is the intended relationship
  and worth an assertion, but means the spec must not expect `__homecoming()` to be non-null.
- **Mark precedence.** At the founding hour one Bowl resident is asleep and one keeps the vigil.
  Both may also be graded. The refresh must yield to the existing marks, so criterion 2's
  "every graded dino shows a mark" is **false as stated** for a dino that is simultaneously
  asleep or on vigil. Assert it against dinos wearing no higher mark, and say so in the spec —
  this is the same shape of finding cycle 149 recorded rather than papered over.
- Grades ride personalities that also drive chronotype. A future trait change can collapse the
  founding spread; unit test 4 is the tripwire and must fail loudly rather than skip.

### Estimated touch count

~6 files. Both tracks together: **~11 files** — inside the CHARTER v6 arc size.

---

## Cross-track collision

`WorldScene.ts` is edited by both tracks and `away.ts` by both (529 comments its header, 116 reads
its result). **Order: 529 complete and green, commit-ready, before 116 begins.** The two touch
disjoint regions of `WorldScene.ts` (529: `checkVigil`/`recordVisit` + one hook; 116: `spawnDino`,
the mark chain, the two catch-up blocks, `pickTone`, two hooks), so after sequencing there is no
overlapping edit — but the sequence is not optional, because 116's catch-up work sits four lines
from `recordVisit`.

---

## Shipped

**Files touched (8):**

- `game/src/world/keeperclock.ts` (new) — the seam and its three answers.
- `game/src/world/missed.ts` (new) — grades, builders, fitted bars.
- `game/src/world/away.ts` — the duration-vs-hour-of-day note.
- `game/src/scenes/WorldScene.ts` — both tracks, in the planned order.
- `tests/unit/keeperclock.test.ts` (new), `tests/unit/missed.test.ts` (new).
- `tests/e2e/cycle-149-vigil.spec.ts` — third test rewritten onto `__keeperNow`.
- `tests/e2e/cycle-150-missed.spec.ts` (new).

**Deviations from the plan**

1. `MISSED_MARK_STEPS` and `MISSED_FAINT_ALPHA` were placed in `missed.ts` rather than in the
   scene. The plan named them without saying where they live; the module is where every other
   number this feature has lives, and `companyTraceIsFresh` sets that precedent for a step budget.
2. The greet spec asserts `` `${name}: 💭` `` rather than a line *starting* with the glyph. The
   first draft got this wrong and the test caught it: `pickTone` returns
   `<source-prefix><name>: <opener> <reply>`, so the opener leads the dino's own words and not the
   string. The assertion was corrected to the shape the code actually has — the opener still leads
   everything the dino says, which is the claim that mattered.
3. The `aloof` step ships as the same rig at `MISSED_FAINT_ALPHA` rather than a second rig. One
   glyph, two alpha steps, and a third step of nothing — noted for the Artist, since BACKLOG-531
   is drawn tonight against exactly this host.

**Gates**

- `npm run build` — clean.
- `npx vitest run` — **2440 passed**, 3 skipped, 234 files.
- `npx playwright test` — **659/659 passed** (5.8m), full suite, no flake on the full run.
- `@mlc-ai/web-llm` grep outside `game/src/ai/` — no hits. Boundary intact.
- `new Date(` grep outside tests — hits only in `keeperclock.ts`. Structure criterion one holds.
- Save shape unchanged; no new persisted field on either track.
