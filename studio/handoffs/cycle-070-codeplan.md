# Cycle 70 — Code Plan

## Lore track

**Item:** BACKLOG-310 — Quirk shaded by feeling.

**Files to create:**
- `tests/unit/cycle-070-mood-fidget.test.ts`
- `tests/e2e/cycle-070-mood-fidget.spec.ts`

**Files to modify:**
- `game/src/world/fidget.ts` — add `export type Mood = 'sulk' | 'cold';`, two const
  maps `MOOD_GLYPH`/`MOOD_CLAUSE`, and `export function moodFidget(p, mood?): Quirk`
  (delegates to `fidget(p)`; no-mood returns it unchanged; with mood overlays the
  clause on the label and, for sulk, swaps the glyph to 😒 — cold keeps base glyph).
- `game/src/scenes/WorldScene.ts` —
  1. import `moodFidget` (extend the existing `import { fidget } from '../world/fidget'`).
  2. `refreshActivityMarks` (~line 1717): compute `mood = this.pendingRepair === d.name ? 'sulk' : undefined` and render `moodFidget(d.traits, mood).glyph` for the `wandering` case.
  3. dev hooks block (~line 1082, beside `__fidget`): add
     `(window as any).__moodFidget = (name, mood) => { const d = this.dinos.find(x=>x.name===name); return d ? { ...moodFidget(d.traits, mood) } : null; };`

**Reuse list:**
- `fidget()` + `Quirk` + `IDLE_QUIRKS` — `game/src/world/fidget.ts`. `moodFidget`
  MUST call `fidget(p)` for the base, never re-derive the axis logic.
- `this.pendingRepair` (BACKLOG-125) and `this.coldPending` (BACKLOG-184) — existing
  transient-mood state on WorldScene; no new tracking.
- `__fidget` hook pattern — `WorldScene.ts:1082`. Mirror it for `__moodFidget`.

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-070-mood-fidget.test.ts`): no-mood deep-equals `fidget(p)` (several
  personalities); sulk glyph 😒 + label `<sig>, sulking`; cold glyph base + label
  `<sig>, shivering`; label always starts with the signature label.
- E2E (`cycle-070-mood-fidget.spec.ts`): boot; for the first dino assert
  `__moodFidget(name)` equals `__fidget(name)`; `__moodFidget(name,'sulk').glyph==='😒'`
  and label ends with `, sulking`; `__moodFidget(name,'cold')` label ends with
  `, shivering`. Zero console errors.

**Risks:** the live cold glyph is intentionally NOT shaded (the 🥶 mark already
floats) — only sulk drives the live activity glyph. Don't shade cold at the render
site or two 🥶 stack.

**Estimated touch count:** ~4 files.

---

## Structure track

**Item:** BACKLOG-309 — Stockpile capacity + pressure.

**Files to create:**
- `tests/unit/cycle-070-stockpile-cap.test.ts`
- `tests/e2e/cycle-070-stockpile-cap.spec.ts`

**Files to modify:**
- `game/src/world/resource.ts` — add `export const STOCKPILE_CAP = 8;`,
  `export function atCap(pile, kind): boolean`, and make `bankResource` clamp
  (return `pile` unchanged when `atCap(pile, kind)`).
- `game/src/scenes/WorldScene.ts` — `checkGather` (~line 819-824): after
  `const kind = this.resource.kind;`, branch — `if (atCap(this.stockpile, kind))`
  log `${RESOURCE_GLYPH[kind]} stores full — ${taker.name} drops the ${kind}` and
  skip the `bankResource` assignment; else bank as today. Import `atCap` (extend the
  existing `bankResource` import block ~line 75).

**Reuse list:**
- `bankResource`, `Stockpile`, `RESOURCE_GLYPH`, `craft`, `canCraft` —
  `game/src/world/resource.ts`. The cap is a new const + guard, not a rewrite.
- `this.logEvent` — WorldScene's existing event log (used by 286 craft beat).
- `__stockpile` hook — `WorldScene.ts:595`; the e2e reads it (no new hook needed).
- `__spawnResource` + `__stepWorld` staging — see `tests/e2e/cycle-064-craft.spec.ts`.

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-070-stockpile-cap.test.ts`): `atCap` true at 8 / false at 7 / false
  on missing kind; `bankResource` clamps at 8 (input purity held); below cap still
  banks; a `craft` that spends a kind drops it below cap (`atCap` false after).
- E2E (`cycle-070-stockpile-cap.spec.ts`): boot; bank 9 branches (no stones, so no
  craft fires) onto the first dino; assert `__stockpile().branch === 8` (the 9th
  stalled, not banked); zero console errors.

**Risks:** `stockpileLine` must stay byte-identical — do NOT add a "full" suffix
(cycle-063 asserts exact strings). The pressure surfaces via the log beat only.
The single-resource-slot deadlock (lingering on ground) is rejected by design.

**Estimated touch count:** ~4 files.

---

## Cross-track collision

`WorldScene.ts` is touched by both, in different methods (`refreshActivityMarks` +
hooks block for 310; `checkGather` + import block for 309) and different imports
(`fidget` vs `resource`). No shared lines — either order is safe. Pure modules are
separate files. Combined: ~6 unique files (2 specs + 2 unit + fidget.ts +
resource.ts + WorldScene.ts).

---

## Shipped (Coder)

**Files touched:**
- `game/src/world/fidget.ts` — `Mood`, `MOOD_GLYPH`/`MOOD_CLAUSE`, `moodFidget()`.
- `game/src/world/resource.ts` — `STOCKPILE_CAP=8`, `atCap()`, `bankResource` clamp.
- `game/src/scenes/WorldScene.ts` — `moodFidget`/`Mood` + `atCap` imports; `refreshActivityMarks` shades the wandering glyph for a sulk; `__moodFidget` hook; `checkGather` stalls (consume-no-bank + log) at cap.
- `tests/unit/cycle-070-mood-fidget.test.ts` (4), `tests/unit/cycle-070-stockpile-cap.test.ts` (5).
- `tests/e2e/cycle-070-mood-fidget.spec.ts`, `tests/e2e/cycle-070-stockpile-cap.spec.ts`.

**Deviations from plan:** none.

**Build + unit-test status:** `npm --prefix game run build` clean; `npm run test:unit` 698/698 (was 689 + 9 new). Dev server boots (HTTP 200). E2E left to QA.
