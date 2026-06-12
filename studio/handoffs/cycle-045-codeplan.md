# Cycle 45 — Code Plan

## Item
BACKLOG-192 [emergent] Dawn chorus — at the dawn boundary the cast greets the day each in its
own voice (191's chirps), staggered by energy: early risers first, night-owls last and grudging.

## Files to create
- `game/src/audio/chorus.ts` — pure module, no Phaser/WebAudio (Node-testable, mirrors
  `audio/chirp.ts` / `world/cold.ts` shape):
  - `export const DAWN_HOUR = 7` — the warm visible dawn (the 07:00 day/night keyframe).
  - `export const CHORUS_SPREAD_MS = 1800` — total stagger across the cast (desk-companion short).
  - `export interface ChorusEntry { name: string; delayMs: number }`
  - `export function chorusOrder(dinos: ReadonlyArray<{ name: string; traits: Personality }>): ChorusEntry[]`
    - Sort a copy by **descending `traits.energy`**, tie-break **ascending `name`** (localeCompare)
      → deterministic/stable.
    - Map to delays: the highest-energy entry gets `0`; the rest scale by their position in the
      energy span so the order is non-decreasing and the lowest-energy gets the largest delay.
      Use a **value-based** map (not just rank) so the spacing reads the trait, but clamp to keep
      it monotonic. Concretely, with `eMax`/`eMin` over the cast:
      `delayMs = Math.round(CHORUS_SPREAD_MS * (eMax - energy) / (eMax - eMin || 1))`.
      This yields first `=0`, last `=CHORUS_SPREAD_MS` (when energies differ), non-decreasing down
      the sorted order. (Equal-energy cast → all `0`, still valid: criterion only requires `>0`
      for the last "whenever energies differ".)
    - Empty input → `[]`.
  - Import `type { Personality }` from `../ai/personality`.

## Files to modify
- `game/src/scenes/WorldScene.ts` (thin glue only):
  - **Import**: add `chorusOrder, DAWN_HOUR, type ChorusEntry` from `../audio/chorus`.
  - **Field**: `private lastDawnDay = 0;` (transient; 0 ⇒ "no dawn fired yet", re-derived from
    clock — NOT persisted). Add near `lastSeasonDay` (line ~145). Also `private dawnCount = 0;`
    and `private lastChorus: ChorusEntry[] | null = null;` for the dev hooks / once-per-day guard.
  - **Wire the boundary** into the existing dawn-reflection `onHour` block (line ~1040, the
    `if (t.hour !== 6) return;` listener is hour-6-specific — do **not** fold into it; add a
    *separate* `getWorldClock().onHour((t) => this.checkDawnChorus(t));` registration in the same
    setup area so reflection/season/autosave are untouched). `onHour` only fires on live ticks,
    never on `clock.set()` → boot/restore/away are silent by construction.
  - **New method** `private checkDawnChorus(t: GameTime): void`:
    - `if (t.hour !== DAWN_HOUR) return;`
    - `if (t.day === this.lastDawnDay) return;` then `this.lastDawnDay = t.day;` (once-per-day;
      a fresh day re-arms).
    - `const order = chorusOrder(this.dinos); this.lastChorus = order; this.dawnCount++;`
    - `this.logEvent('🌅 dawn');` (one faint line — `logEvent` already exists, used by season/gossip).
    - For each `{ name, delayMs }`: find the dino by name and
      `this.time.delayedCall(delayMs, () => { const d = this.dinoByName(name); if (d) this.chirpFor(d); });`
      (`chirpFor` already guards `soundMuted()` + unlocked ctx, and records `lastSound` intent).
  - **Dev hooks** (in the same `(window as any)` block that defines `__season` etc., ~line 2107):
    - `__lastChorus = () => this.lastChorus` (array of `{name, delayMs}` or null)
    - `__dawnCount = () => this.dawnCount`
    - `__dawnHour = () => DAWN_HOUR`
    - `__chorusOrder = () => chorusOrder(this.dinos)` (pure order on demand, mute-independent —
      lets the muted-path test read the order without playback).

## Reuse list
- `audio/chirp.ts` `chirpParams` + `chirpFor`/`playChirp` (voice.ts) — the voice path, **unchanged**.
- `WorldScene.chirpFor(d)` (line 1467) — already guards mute + records `lastSound`. Reuse as-is.
- `WorldScene.dinoByName(name)` (line 887) — name→Dino lookup for the delayed callbacks.
- `WorldScene.logEvent(...)` — the 🌅 line (same call season turn / gossip use).
- `getWorldClock().onHour(...)` — the live-only hour seam (reflection line 1040, season 2105).
- `this.time.delayedCall(ms, cb)` — Phaser scheduler, already used for bubbles (line 1319) etc.
- `lastSeasonDay` pattern (line 145 / `checkSeasonTurn` 2134) — the live-only once-per-boundary
  template `lastDawnDay` copies exactly.
- `Personality` type / `energy` axis (ai/personality.ts) — the stagger key.

## New dependencies
none — WebAudio + Phaser scheduler are built-in; the order math is plain TS.

## Test plan
- **Unit** `tests/unit/chorus.test.ts` (vitest, pure — import `chorusOrder`, `DAWN_HOUR`,
  `CHORUS_SPREAD_MS`):
  - orders by descending energy (build dinos with known traits) — first = highest energy.
  - first entry `delayMs === 0`; delays non-decreasing down the returned order; last `> 0` when
    energies differ.
  - equal-energy cast → all `delayMs === 0`, length preserved.
  - energy tie → alphabetical name order (stable/deterministic).
  - founders: build the real roster traits via `personalityFor(name)` and assert the
    highest-energy founder is first and the lowest-energy founder is last (no hand-picked name —
    derive from the seeds, matching the design AC).
  - empty input → `[]`.
- **E2E** `tests/e2e/cycle-045-chorus.spec.ts` (playwright; mirror cycle-040 season's exact
  staged live-crossing harness — `__setClock(d,h,m)` stages a restore-style time with **no**
  beat, `__advanceWall(120_000)` ticks two in-game minutes at 1× across the boundary so a genuine
  `onHour` fires; `__events()` reads the log — all three hooks already exist):
  1. **Live dawn fires once**: `__setClock(D, 6, 59)` then assert `__dawnCount()===0` (staging is
     a restore-like sync, never a beat); `__advanceWall(120_000)` (06:59 → ~07:01, crossing 07:00)
     → `__dawnCount()===1`, `__lastChorus()` is a non-empty array ordered by energy (cross-check
     first/last `name` against `__chorusOrder()`), and `__events()` contains a 🌅 line.
  2. **Once per day**: with the clock already past 07:00 the same day, another `__advanceWall`
     that does not reach a new day's dawn leaves `__dawnCount()` unchanged.
  3. **Restore is silent**: fresh load + `__setClock(D, 7, 30)` straight onto the dawn hour leaves
     `__dawnCount()===0` (no live `onHour` crossing).
  4. **Muted safety**: pre-seed `localStorage 'dino.sound'='off'` before `boot` (see `boot`/
     `addInitScript` in `helpers.ts`), fire a live dawn → `__lastChorus()` still populated, zero
     `pageerror`s collected, and `__audioState()` is honored (never forced into running playback).

## Risks
- **Hour-tick granularity vs. realtime scale.** At 1× a live hour crossing is slow; the e2e
  drives via `__advanceWall(120_000)` exactly like cycle-040 (`__setClock(D,6,59)` →
  `__advanceWall` over 07:00). Reuse that harness; do **not** invent a new clock-advance hook.
  `__advanceWall` ticks the same listeners `onHour` rides, so the live path is genuinely proven.
- **delayedCall after scene teardown** — callbacks are scoped to the scene's clock and die with
  it; the `dinoByName` guard handles a despawn. No leak across the test's single scene.
- **Don't collide with hour-6 reflection** — separate `onHour` registration, different hour;
  verified the reflection block is `hour !== 6` gated.
- **Mute path** must still record the *order* (for the hook) but not play — `chorusOrder` runs
  before the per-dino `chirpFor`, and `chirpFor` self-guards mute, so this falls out for free.

## Estimated touch count
~4 files (1 new module, 1 new unit spec, 1 new e2e spec, 1 modified scene). Well within one
Coder fire.

---

## Shipped

**Files touched (exactly the plan, zero deviations):**
- `game/src/audio/chorus.ts` *(new)* — pure `chorusOrder` + `DAWN_HOUR`/`CHORUS_SPREAD_MS`/`ChorusEntry`.
- `game/src/scenes/WorldScene.ts` *(modified)* — import; `lastDawnDay`/`dawnCount`/`lastChorus` fields; a second live-only `clock.onHour(checkDawnChorus)` registration beside the season turn; `checkDawnChorus(t)` (hour-7 + once-per-day guard → record order, 🌅 logEvent, staggered `delayedCall`→`chirpFor`); four dev hooks (`__lastChorus`/`__dawnCount`/`__dawnHour`/`__chorusOrder`).
- `tests/unit/chorus.test.ts` *(new)* — 8 tests.
- `tests/e2e/cycle-045-chorus.spec.ts` *(new)* — 4 tests.

**Status:**
- `npm --prefix game run build` — ✅ clean (tsc + vite, 9.1s).
- `npm run test:unit` — ✅ 375 passed (41 files), incl. the 8 new chorus tests.
- `npx playwright test cycle-045-chorus` — ✅ 4/4 green (single-worker warm run; the first cold parallel run boot-timed-out on all four = the catalogued cold-boot/optimizeDeps flake, green on the warm re-run).
- Dev server render — ✅ HTTP 200 at `/`.
- Boundary — ✅ chorus.ts is pure (no Phaser/WebAudio); voice.ts still the only WebAudio file; web-llm untouched. No save-format change.
