# Cycle 153 — Code Plan

Two tracks, one Coder fire. They share `WorldScene.ts` and no function.

## Reuse audit (before anything is written)

Checked, and the answer is "already exists" in five places — none of these get a second implementation:

| Need | Already in the tree | Do not write |
|---|---|---|
| Format an away span ("5 minutes", "2 days") | `fmtSpan` in `away.ts` (module-private) | a second span formatter — **export the existing one** |
| Ground's standing / derelict counts | `WorldScene.standingIn(zone)` / `.derelictIn(zone)` | a parallel count off the sprite arrays |
| Resync the stake after a world change | `applyObjectVisibility()` → `syncStakes()` | a new render pass |
| The played frame of a claim | `afterOneSession()` in `reachability.ts` | a second model of a mended park |
| Additive optional save field | ~20 existing `o.X !== undefined` blocks in `deserialize` | a save version bump |

---

## Lore track — BACKLOG-114

### Files

**NEW `game/src/world/awaylog.ts`** — pure, no Phaser.
- `export interface AwayEntry { at: number; minutes: number; lines: string[] }`
- `export const AWAY_LOG_KEPT = 3`
- `keepAwayLog(prev, entry)` → `entry.lines.length ? [entry, ...prev].slice(0, AWAY_LOG_KEPT) : prev`
- `awayLogLines(log, now)` → `[]` when empty; else `'— While you were away —'`, then per entry
  `· <fmtSpan(minutes)> away, <fmtSpan((now-at)/60000)> ago` followed by its lines indented two spaces.
  `now - at` is clamped at 0 (a save carried across a clock change must not print a negative).

**`game/src/world/away.ts`** — one word: `function fmtSpan` → `export function fmtSpan`. Nothing else.

**`game/src/ui/lenses.ts`** — `bookLines(rows: BookRow[], away: string[] = [])`; `out` starts
`['— Collection Book —', ...away]`. Default parameter, so criterion 4 (byte-identical without the argument)
is satisfied by construction rather than by a test that hopes.

**`game/src/world/saveGame.ts`**
- `SaveData.awayLog?: AwayEntry[]` (import the type from `awaylog.ts` — `saveGame.ts` already imports world
  types, and `awaylog.ts` has no Phaser edge).
- `deserialize`: an `o.awayLog !== undefined` block beside `ticsFormed`'s — must be an array; each entry an
  object with finite-number `at` and `minutes` and a `lines` array of strings; anything else → `return null`.
- Add `awayLog` to the returned object literal (~line 886) and to `serialize`'s pass-through if it enumerates
  explicitly (check; most fields ride the spread).

**`game/src/scenes/WorldScene.ts`**
- field `private awayLog: AwayEntry[] = [];`
- restore: `this.awayLog = save.awayLog ?? [];` beside `leftDays` / `cameFrom`.
- **Both digest finalisation points**, and only after the spoilage/upkeep tail is appended:
  - restore path (currently the second `this.lastAwayDigest = away.digest` at ~8344, and the first at ~8329
    when the tail is empty — write the log **once**, after the `if (awaySpoil.length)` block, so it cannot
    capture a half-built digest);
  - `__catchUp`, same position relative to its own tail block.
  In both: `if (away.minutes > 0) this.awayLog = keepAwayLog(this.awayLog, { at: Date.now(), minutes: away.minutes, lines: [...this.lastAwayDigest] });`
  The `minutes > 0` gate mirrors the dialog's own gate — a reload with no gap must not log an entry.
- `currentSaveData()`: `awayLog: this.awayLog`.
- Both book render sites: `bookLines(this.bookRows(), awayLogLines(this.awayLog, Date.now()))` (the
  `bookPanel.setText` at ~4328 and `__bookText` at ~4245).
- hook `(window as any).__awayLog = () => this.awayLog.map((e) => ({ ...e, lines: [...e.lines] }));`

### Tests (lore)

- **NEW `game/src/world/awaylog.test.ts`** — criteria 1, 2, 3, plus the clamp on a negative `now - at`.
- `game/src/ui/lenses.test.ts` — criteria 4, 5 (append; do not restructure the file).
- `game/src/world/saveGame.test.ts` (or its cycle-scoped sibling) — criteria 6, 7.
- **NEW `tests/e2e/cycle-153-awaylog.spec.ts`** — criteria 8, 9, 10. Declare its founding state via
  `foundingState(page, 'as-shipped')` (BACKLOG-495's seam — the fixture is not required to be named yet, but
  a new spec that stays silent is the exact debt BACKLOG-533 is queued over).

### Blocker-if-wrong (lore)

**Do not write the log entry at the `lastAwayDigest` assignment inside `if (awaySpoil.length)`.** There are
two assignments on each path and the first one is the pre-tail digest. Writing at the wrong one produces a
book that is missing the spoilage and upkeep lines *only when there were any* — a bug that passes every
short-gap test.

---

## Structure track — BACKLOG-535

### Files

**`game/src/world/stake.ts`**
- `export const STAKE_KEPT_ART_KEY = 'founder_stake_kept';`
- `export function stakeUpkeepStep(standing: number, derelict: number): boolean` — `standing > 0 && derelict === 0`,
  with the header paragraph carrying the driver decision and the two rejected candidates in one line each
  (the decision must live next to the code, not only in a handoff).
- `stakeArtKey(kind, hollowed, kept)` — `if (!kind) return null; if (hollowed) return HOLLOWED; if (kept) return KEPT; return kind === 'born' ? NATIVE : DRIVEN;`
  Third parameter **required**.

**`game/src/scenes/WorldScene.ts`**
- `syncStakes()` and the `__stake` hook both pass
  `stakeUpkeepStep(this.standingIn(this.zoneId), this.derelictIn(this.zoneId))`. Extract nothing; the two
  expressions are three tokens and a helper would be the abstraction this repo keeps not writing.
- `buildOnGather()`: `this.syncStakes();` beside **both** `this.refreshPlaque()` calls (granary branch and
  bias-landmark branch). This is the one path that does not already reach the sync.

**`game/src/world/reachability.ts`**
- import `STAKE_KEPT_ART_KEY`, `stakeUpkeepStep`; `worldPlacedProps()` adds `STAKE_KEPT_ART_KEY`.
- New `REACHABILITY_REGISTER` entry, placed **after** the `BACKLOG-480/528` entry (it reads the same
  ledger):
  ```
  id: 'BACKLOG-535/518'
  system: "the founder's mark says whether the ground is still being kept up"
  fact:   'the founding Grove ships a ruin, so its stake starts *not* kept — the change is there to watch'
  holds:  () => !stakeUpkeepStep(foundingStanding(GROVE), foundingDerelict(GROVE))
  played: 'the cairn goes back up and the stake changes to the kept mark, in the same minute'
          () => { const a = afterOneSession(); return stakeUpkeepStep(a.standing[z] ?? 0, a.derelict[z] ?? 0); }
  ```
  `foundingStanding` / `foundingDerelict` are **not new exports** — derive them inline the way the
  `BACKLOG-480/528` entry already does (`FOUNDING_LANDMARKS.filter(...).length`, `FOUNDING_RUIN.zone === z ? 1 : 0`).
  No literals.

### Tests (structure)

- **NEW `game/src/world/cycle-153-stake.test.ts`** — criteria 1–8 and criterion 9's `worldPlacedProps`
  membership, plus `darkEntries()` empty (criterion 11 — **a unit test, not e2e**: `darkEntries` is a pure
  export and `cycle-152-played.test.ts` already asserts it that way; the design's "e2e" label there was
  wrong and this plan corrects it).
- `game/src/world/cycle-145-stake.test.ts` — update its `stakeArtKey` calls for the third argument.
- **NEW `tests/e2e/cycle-153-stake.spec.ts`** — criterion 10: `foundingState(page, 'as-shipped')`,
  `__setZone(GROVE)`, `__stake()` is `founder_stake`, drive `__stepMend()` until `__mend()` is null and the
  ruin is gone, `__stake()` is `founder_stake_kept`.

### Blocker-if-wrong (structure)

1. **`standing > 0` is not optional.** Dropping it makes the bare Bowl read as kept, which is the inverse of
   the item, and every one of the founded/played register claims would still pass.
2. **The Grove's founding kind.** If the Grove's founder is `born`, the pre-cycle key is
   `founder_stake_native`, not `founder_stake` — check `seedFoundingPioneers` before writing the e2e
   assertion, and assert whatever it actually is rather than what reads nicer.

---

## Order of work

1. `stake.ts` (pure, no dependents beyond two call sites) → its unit test → the `cycle-145-stake` fixup.
2. `WorldScene` stake wiring + `reachability.ts` entry → unit test green.
3. `away.ts` export → `awaylog.ts` + test.
4. `lenses.ts` + `saveGame.ts` + `WorldScene` book/save wiring.
5. `npm run build`, `npx vitest run`, then `npx --yes kill-port 5173 && npx playwright test`.

Gates before the Coder may commit: build clean, full vitest green, full playwright green,
`@mlc-ai/web-llm` still imported only under `game/src/ai/`, tree clean.

---

## Shipped

Both tracks. 11 files: 1 new module, 4 new test files, 6 edits.

- `game/src/world/awaylog.ts` (new) · `game/src/ui/lenses.ts` · `game/src/world/saveGame.ts` ·
  `game/src/world/stake.ts` · `game/src/world/reachability.ts` · `game/src/scenes/WorldScene.ts`
- `tests/unit/cycle-153-awaylog.test.ts` (new, 9) · `tests/unit/cycle-153-stake.test.ts` (new, 10) ·
  `tests/e2e/cycle-153-awaylog.spec.ts` (new, 3) · `tests/e2e/cycle-153-stake.spec.ts` (new, 2) ·
  `tests/unit/cycle-145-stake.test.ts` (six `stakeArtKey` calls take the third argument)

### Deviation from the plan — the span stamp, and it is a reuse call

The plan said to **export `fmtSpan`** from `away.ts` and stamp each log entry with how long ago the return
happened. Neither shipped, and the reason is the plan's own reuse doctrine pointed the other way once the
code was in front of it:

1. **The span is already there.** The digest's own first line is `The bowl ran on for <span>.` — written by
   `away.ts`, in `away.ts`'s words. A stamp in the log would be that fact written down twice, which is the
   defect BACKLOG-495 exists over.
2. **`fmtSpan` is the wrong unit for "ago".** It divides by `MINUTES_PER_DAY`, an *in-game* day. `at` is
   wall-clock. Feeding one to the other would have printed a real half-hour as an in-game span, and it would
   have looked right in every test that used a round number.

So `awayLogLines(log)` takes no `now`, exports no formatter, and orders newest-first with a divider between
returns. `at` and `minutes` are still **kept in the entry and in the save** — they are cheap, they are the
two different facts (your afternoon, the bowl's), and the third e2e spec asserts ordering off both.

### Gates

- `npm run build` — clean.
- `npx vitest run` — **2534 passed**, 3 skipped, 242 files.
- `npx playwright test` — **674 passed, 1 failed**, twice, with a **different victim each run**
  (`cycle-082-comfort-food`, then `cycle-121-yearning`), both boot timeouts in `helpers.boot`, both green
  when re-run isolated. That is the parallel-load flake the routine names, not a regression — but it is
  worth the Validator's attention that it is **back**: cycle 148 recorded this project's first all-green
  suite and cycle 152 ran 670/670. See the QA handoff.
- `@mlc-ai/web-llm` — grep clean outside `game/src/ai/`.
- Save changes additive, no version bump. Tree clean at commit.
