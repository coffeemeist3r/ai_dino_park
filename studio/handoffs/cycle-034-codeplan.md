# Cycle 34 — Code Plan

## Item
BACKLOG-132 [emergent] Gratitude echo.

## Approach
Pure-module extension of `world/comfort.ts` (add a `Gratitude` ledger type + `recordGratitude` + an optional `gratitude` param on `comforter`), an additive `gratitude` field through `saveGame.ts`, and thin WorldScene glue (a `this.gratitude` field, record it after a comfort beat, feed it into the `comforter()` call, persist/restore it, expose a `__gratitude` hook). `homecoming.ts` and the BACKLOG-125 repair seam are not touched.

## Files to create
- `tests/unit/gratitude.test.ts` — unit tests for the new `recordGratitude` + gratitude-aware `comforter` (kept separate from `comfort.test.ts` so the existing 7 tests stay visibly unchanged; this file also re-asserts the no-ledger fallback).
- `tests/e2e/cycle-034-gratitude.spec.ts` — the two-homecoming echo flow + the `__gratitude` ledger assertion.

## Files to modify
- `game/src/world/comfort.ts`
  - Add `export type Gratitude = Record<string, string[]>` (`consoled → comforters it owes`).
  - Add `export function recordGratitude(g: Gratitude, consoled: string, byWhom: string): Gratitude` — returns a new map with `byWhom` appended under `consoled`, deduped (no-op if already present), never mutates input.
  - Extend `comforter(sulker, bonds, names, gratitude?: Gratitude)` with an optional trailing `gratitude` param. New behavior, evaluated **before** the existing closest-friend scan: find present `names` `d !== sulker` where `gratitude?.[d]?.includes(sulker)` (i.e. `d` was consoled *by* `sulker` and so owes it) — among those grateful debtors pick highest `bondPoints(bonds, sulker, d)`, tie-break lexicographically-smallest name, and return it **ignoring the floor**. If no present debtor, fall through to the existing floor-gated closest-friend logic unchanged.
- `game/src/world/saveGame.ts`
  - Import `Gratitude` from `./comfort` (type-only).
  - Add `gratitude?: Gratitude` to `SaveData` (additive; documented like `memory`).
  - In `deserialize`: parse `o.gratitude` like `memory` (object of string→string[]; reject malformed, default `{}` when absent). Add to the returned object. No `SAVE_VERSION` bump.
- `game/src/scenes/WorldScene.ts`
  - Import `recordGratitude` (and `type Gratitude`) from `../world/comfort`.
  - Add `private gratitude: Gratitude = {};`.
  - In `playHomecoming()`: pass `this.gratitude` as the 4th arg to `comforter(...)`; after a successful comfort beat, `this.gratitude = recordGratitude(this.gratitude, hc.jealous.name, who)`.
  - In `currentSaveData()`: add `gratitude: this.gratitude`.
  - In the boot load (`setupSave` → `loadFromDb().then`): `this.gratitude = save.gratitude ?? {}`.
  - Add dev hook: `(window as any).__gratitude = () => ({ ...this.gratitude });`.

## Reuse list (CHARTER demands reuse)
- `social/bonds.ts` — `bondPoints` for ranking debtors; `strengthen`/`COMFORT_BOND` already used in the glue. Do NOT reinvent bond math.
- Existing `comfort.ts` selection (`comforter`, alpha tie-break convention) — extend, do not fork.
- Save additive pattern — mirror exactly how `memory` (object of string→string[]) is parsed/defaulted in `saveGame.ts` (`gratitude` has the identical shape, so the validation loop is a copy with `gratitude` substituted).
- Memory-ledger dedup shape — `recordGratitude` mirrors `ai/memory.ts` `remember`'s "append to a per-key string[] in an immutable map" idiom (dedup added).
- WorldScene dev-hook + persist/restore pattern — copy the `bonds`/`memory` plumbing lines verbatim with `gratitude` substituted.
- E2E hooks already present: `__greet`, `__bondPair`, `__bonds`, `__catchUp`, `__lastComfort`, `__bubbleTexts`, `__pendingRepair`. Add only `__gratitude`.

## New dependencies
none.

## Test plan
### Unit (`tests/unit/gratitude.test.ts`)
- `recordGratitude` appends `byWhom` under `consoled` and the ledger reflects it.
- `recordGratitude` is deduped — recording the same `(consoled, byWhom)` twice yields a single entry.
- `recordGratitude` does not mutate its input (input ledger unchanged; returns a new object).
- `comforter` with `undefined`/`{}` gratitude == cycle-33 behavior (returns the floor-gated closest friend; null when none clear the floor).
- gratitude override: a grateful debtor is returned even though another peer has a strictly higher bond with the sulker.
- gratitude override ignores the floor: debtor with bond `< COMFORT_BOND_FLOOR` is still returned.
- multiple debtors: highest-bond debtor wins; bond tie → lexicographically-smallest name.
- a debtor not in `names` is ignored → falls back to the normal rule (or null).

### Unit (`tests/unit/saveGame.test.ts`, extend)
- round-trip a `SaveData` carrying a non-empty `gratitude` ledger (serialize → deserialize equal).
- a save JSON with no `gratitude` field deserializes with `gratitude === {}`.
- a malformed `gratitude` (e.g. `{ Rex: 5 }` / `{ Rex: [1] }`) → `deserialize` returns null.

### E2E (`tests/e2e/cycle-034-gratitude.spec.ts`)
1. **Files the debt:** boot; greet Sunny + Glade (near-tie, Glade homecomes / Sunny sulks by alpha); `__bondPair('Sunny','Twitch')` ×2 so Twitch is Sunny's closest friend. `__catchUp(HALF_DAY)` → Twitch consoles Sunny; assert `__lastComfort` = `{comforter:'Twitch', sulker:'Sunny'}` and `__gratitude().Sunny` includes `'Twitch'`.
2. **The echo:** continuing the same page — set Twitch's *highest* bond to Glade (`__bondPair('Glade','Twitch')` ×4 ≈32 > Sunny↔Twitch ≈16), then greet Rex ×25 + Twitch ×25 (both clamp to 100 → near-tie; Twitch is alpha-largest so it's the runner-up/sulker). `__catchUp(HALF_DAY)` → assert `__lastComfort().comforter === 'Sunny'` (the grateful debtor) **not** `'Glade'` (the higher-bond peer): reciprocity beat raw bond. Also assert a `🫂` bubble naming Sunny is alive.

## Risks
- **Ranking determinism in the echo e2e.** Greeting Rex/Twitch enough times (×25) drives both to the 100-point clamp regardless of per-dino greet gain, guaranteeing an exact tie → `topBy` picks alpha-min (`Rex`) as homecomer and `Twitch` (alpha-largest of the cast) as runner-up. Robust as long as `greetGain ≥ 1` (it is: `BASE_GAIN=3`). If a future roster rename makes another open dino alpha-after Twitch, revisit — fine for the current cast (Glade, Mossback, Rex, Sunny, Twitch).
- **Bond floor vs override.** The override path must skip the floor check; keep the floor only on the fallback scan. Easy to conflate — write the override as an early return.
- **`homecoming.ts` accidental edit.** Selection lives entirely in `comfort.ts`; resist adding gratitude to `homecoming.ts`. The glue only passes `this.gratitude` into `comforter`.
- Known parallel-load e2e boot flake (cycle-002/003 webllm bundle) may show in the full run — re-run isolated to confirm; not a regression.

## Estimated touch count
~6 files (3 source: comfort.ts, saveGame.ts, WorldScene.ts; 2 new tests; 1 extended test). Within budget; no split needed.

## Shipped
**Files touched (6, as planned):**
- `game/src/world/comfort.ts` — added `Gratitude` type, `recordGratitude` (immutable + deduped), and an optional trailing `gratitude` param on `comforter` (reciprocity override evaluated first, ignores the floor, highest-bond debtor with alpha tie-break; falls through to the unchanged cycle-33 closest-friend scan).
- `game/src/world/saveGame.ts` — `gratitude: Gratitude` added to `SaveData` + parsed in `deserialize` (mirrors the `memory` validation; defaults `{}`; rejects malformed). No `SAVE_VERSION` bump.
- `game/src/scenes/WorldScene.ts` — `this.gratitude` field; `playHomecoming` passes it into `comforter` and `recordGratitude`s after a beat; persisted in `currentSaveData` + restored on load; `__gratitude` dev hook.
- `tests/unit/gratitude.test.ts` (new, 12 tests), `tests/e2e/cycle-034-gratitude.spec.ts` (new, 2 tests), `tests/unit/saveGame.test.ts` (extended +3).

**Deviations from plan:**
- E2E determinism: the plan sketched greeting Sunny/Glade ×25. Greet gain is per-dino (≥3/greet), so equal greet *counts* do not tie — the intended runner-up was wrong. Switched to **saturating** the chosen pair to the 100-point cap (×40 ≥ the 34 needed at min gain 3) for an exact tie, and chose roles by alpha order (homecomer Glade, round-1 sulker Rex consoled by Mossback, round-2 sulker Mossback echoed by debtor Rex over higher-bond peer Twitch). Pure-module logic unchanged; only the test's staging changed.
- `SaveData.gratitude` is **required** (not optional), matching `memory`/`bonds`; `currentSaveData` always supplies it and `deserialize` always defaults it, so old saves still load. Test SaveData literals updated where they construct full objects (only `saveGame.test.ts` needed it; others aren't type-checked by the build).

**Status:** `npm --prefix game run build` ✅ clean. `npx vitest run` ✅ **231/231**. New e2e ✅ 2/2 on `--workers=1` (parallel run hits the documented cycle-002/003 webllm boot flake — QA to confirm). Dev server ✅ HTTP 200.
