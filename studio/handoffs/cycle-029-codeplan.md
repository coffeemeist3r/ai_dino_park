# Cycle 29 — Code Plan

## Item
BACKLOG-106 [emergent] Offline catch-up ("while you were away").

## Files to create
- `game/src/world/away.ts` — pure fast-forward module. Exports:
  - `MAX_AWAY_DAYS = 7` (const), and internal `MINUTES_PER_DAY`, `COMPANION_MIN_BOND = 8` (= `HUDDLE_THRESHOLD`), `DRIFT_PER_DAY = 2`, `MAX_DRIFT = 12`.
  - `interface AwayInput { time: GameTime; savedAt?: number; scale?: number; bonds: Bonds; memory: MemoryStore }`
  - `interface AwayResult { minutes: number; days: number; capped: boolean; time: GameTime; bonds: Bonds; memory: MemoryStore; digest: string[] }`
  - `awayMinutes(savedAt: number | undefined, scale: number | undefined, nowMs: number): number` — `0` if `savedAt` undefined or `nowMs <= savedAt`; else `floor((nowMs - savedAt) * (scale>0?scale:1) / 60000)`.
  - `fastForward(input: AwayInput, nowMs: number): AwayResult` — compute raw away minutes, cap at `MAX_AWAY_DAYS*MINUTES_PER_DAY` (set `capped`), advance time via `advanceTime`. If minutes ≤ 0 → identity result, empty digest. Else build digest starting with a duration line; if `days >= 1`, drift every `bondedPairs(bonds, COMPANION_MIN_BOND)` pair by `min(DRIFT_PER_DAY*days, MAX_DRIFT)` via `strengthen`, add a "kept each other company" memory to both names via `remember`, and headline the top ≤2 resulting pairs in the digest; if no companion pairs, push "The cast kept to themselves." For sub-day spans push "Barely long enough to notice."
- `tests/unit/away.test.ts`
- `tests/e2e/cycle-029-away.spec.ts`

## Files to modify
- `game/src/world/clock.ts` — add and export a pure `advanceTime(t: GameTime, minutes: number): GameTime` (`absToTime(timeToAbs(t) + max(0, floor(minutes)))`), reusing the existing module-private `timeToAbs`/`absToTime`. No behavior change to `tick`/`update`.
- `game/src/scenes/WorldScene.ts`:
  - Import `fastForward` from `../world/away`.
  - Add field `private lastAwayDigest: string[] = [];`.
  - In `setupSave()` restore (`loadFromDb().then`): after `if (!save) return;`, restore scale (`if (save.scale) clock.setScale(save.scale)`), call `const away = fastForward({ time: save.time, savedAt: save.savedAt, scale: save.scale, bonds: save.bonds, memory: save.memory }, Date.now())`, then `clock.set(away.time)` (instead of `save.time`), set `this.bonds = away.bonds; this.memory = away.memory;`, store `this.lastAwayDigest = away.digest;`, and if `away.minutes > 0` show the panel: `this.dialogOpen = true; this.dialog.show('While you were away…\n' + away.digest.join('\n'));`. Keep the rest of the restore (player pos, friendship, born/eggs respawn, HUD/tint refresh) as-is.
  - Add dev hooks near the other `__` hooks in `setupSave`: `__awayDigest` (returns `[...this.lastAwayDigest]`) and `__catchUp(realMs)` (runs `fastForward({ time: clock.now(), savedAt: 0, scale: clock.getScale(), bonds: this.bonds, memory: this.memory }, realMs)`, applies `clock.set`, `this.bonds`, `this.memory`, `this.lastAwayDigest`, calls `this.refreshHeartsPanel()`, returns `{ days, minutes, capped, digest }`).

## Reuse list (MUST reuse — do not reinvent)
- `bondedPairs(bonds, minPts)` — `game/src/ui/lenses.ts:28` (already returns descending-sorted, filters `>= minPts`).
- `strengthen(bonds, a, b, delta)` / `bondPoints` — `game/src/social/bonds.ts`.
- `remember(store, name, event)` — `game/src/ai/memory.ts`.
- `timeToAbs` / `absToTime` — already in `game/src/world/clock.ts`; expose only the new `advanceTime` wrapper rather than duplicating the math.
- `HUDDLE_THRESHOLD` value (8) — mirror as `COMPANION_MIN_BOND` in away.ts (away.ts is pure and shouldn't import from WorldScene; keep the literal with a comment).
- Existing `DialogBox.show` for the panel; existing `__bonds`/`__bondPair` hooks for the e2e seed.

## New dependencies
none.

## Test plan
- Unit (`tests/unit/away.test.ts`):
  - `awayMinutes`: undefined savedAt → 0; now ≤ savedAt → 0; scale applied (e.g. savedAt 0, now 120000ms, scale 1 → 2; scale 60 → 120).
  - `fastForward` 0 elapsed → time/bonds/memory unchanged, digest `[]`.
  - `fastForward` multi-day → time advanced by exactly capped minutes (abs-minute check); companion pair (seed bond ≥ 8) bond rises by `min(DRIFT_PER_DAY*days, MAX_DRIFT)`; sub-threshold pair unchanged.
  - companion memory: both names gain a "kept each other company" entry.
  - cap: huge gap → `capped true`, `minutes === MAX_AWAY_DAYS*1440`, `days === 7`, digest mentions the overflow.
  - sub-day span (e.g. 3 in-game hours) → bonds unchanged, digest has duration + "Barely long enough" line.
- E2E (`tests/e2e/cycle-029-away.spec.ts`):
  - boot → `__bondPair('Rex','Glade')` (8 ≥ threshold) → read `__bonds`; `__catchUp(3*86_400_000)` (3 in-game days at 1×) → expect returned `days === 3`, `__bonds` Rex|Glade increased by 6, `__awayDigest()` contains a "grew closer" line.
  - fresh boot, no save → no homecoming dialog (assert `dialog` not visible / `__awayDigest()` empty). Use existing dialog-visibility hook if present; else assert `__awayDigest()` is `[]`.

## Risks
- **Double-advance:** the live `update()` pump must not re-advance over the away gap. `clock.set(away.time)` re-anchors at `Date.now()`, so the pump starts counting from the post-catch-up moment — safe. Don't also call `clock.set(save.time)`.
- **Dialog on immediate reload (cycle-003):** an instant reload has elapsed ≈ 0 → `awayMinutes` floors to 0 → `minutes 0` → empty digest, no dialog. Confirmed safe, but QA should run cycle-003 to be sure.
- `__catchUp` uses `savedAt: 0` and `nowMs: realMs` so elapsed = realMs exactly — deterministic regardless of wall clock.
- Keep away.ts free of Phaser/WebLLM imports (it's pure + Node-tested).

## Estimated touch count
~5 files (2 new src/test-shared modules + clock + WorldScene + 2 test files = within the 6-file budget; clock change is a 3-line additive export).

---

## Shipped (coder)

**Files touched:**
- `game/src/world/away.ts` (new) — `awayMinutes`, `fastForward`, `MAX_AWAY_DAYS`, `AwayInput`/`AwayResult`. Pure; reuses `bondedPairs`/`strengthen`/`remember`/`advanceTime`.
- `game/src/world/clock.ts` — added exported pure `advanceTime(t, minutes)`; no change to `tick`/`update`.
- `game/src/scenes/WorldScene.ts` — import `fastForward`; `lastAwayDigest` field; restore now re-applies saved scale, fast-forwards over the gap (`clock.set(away.time)`), applies rolled bonds/memory, shows "While you were away…" panel when `minutes > 0`; added `__catchUp`/`__awayDigest` dev hooks.
- `tests/unit/away.test.ts` (new) — 13 cases.
- `tests/e2e/cycle-029-away.spec.ts` (new) — 2 specs.

**Deviations from plan:** none.

**Build:** ✅ `npm run build` clean (tsc -b + vite build).
**Unit:** ✅ `npm run test:unit` — 170 passed (was 157; +13 new in away.test.ts).
**Dev render:** ✅ dev server returns HTTP 200 at `/`.
