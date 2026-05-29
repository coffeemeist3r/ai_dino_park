# Cycle 6 — Code-plan

## Item
BACKLOG-016 [social] Friendship hearts.

## Files to create
- `game/src/social/friendship.ts` — pure, no Phaser.
  - `export const MAX_POINTS = 100; export const HEARTS_MAX = 10;`
  - `export type Friendship = Record<string, number>` (name → points 0..100)
  - `export const BASE_GAIN = 3`
  - `heartsFromPoints(points): number` — `clamp(floor(points/10), 0, 10)`.
  - `bumpPoints(f, name, delta): Friendship` — returns a NEW object, clamped [0,100]. Immutable.
  - `heartString(hearts): string` — `'♥'*h + '♡'*(10-h)`.
  - `greetGain(traits?): number` — `BASE_GAIN + round(2*agreeableness + 1*sociability)` when traits present (so warm+social > prickly+solitary), else `BASE_GAIN`. Bounded ≤ 10.
- `tests/unit/friendship.test.ts` — pure-module tests + the save round-trip test (folded here to hold the file count).
- `tests/e2e/cycle-006-hearts.spec.ts` — greet→persist + panel toggle.

## Files to modify
- `game/src/world/saveGame.ts`
  - `SaveData` gains `friendship: Friendship` (import the type).
  - `serialize` unchanged (stringifies the whole object).
  - `deserialize`: after the existing time/player validation, read `o.friendship` — if absent → `{}`; if present must be an object whose values are all finite numbers (else reject). Keep `SAVE_VERSION = 1` (additive + optional = the version seam, not BACKLOG-040 migration).
- `game/src/scenes/WorldScene.ts`
  - Field `private friendship: Friendship = {}` and `private heartsPanel!: Phaser.GameObjects.Text`.
  - `currentSaveData()` includes `friendship: this.friendship`.
  - On load restore: `this.friendship = save.friendship` (+ refresh panel if visible).
  - In `handleInteract()`, after a successful greet of `target`: `this.friendship = bumpPoints(this.friendship, target.name, greetGain(target.traits)); void this.saveGame(); this.refreshHeartsPanel()`.
  - `setupHearts()` (called from `create()`): build the hidden panel (depth 11, above HUD), add **C** key to toggle visibility + refresh, dev hooks `__hearts`/`__greet`/`__heartsPanelVisible`.
  - `refreshHeartsPanel()`: rebuild text from `ROSTER` order + `this.friendship`.
  - `__greet(name)`: apply `greetGain` (look up the dino's traits) + save + refresh; return hearts — lets QA drive the loop without walking.

## Reuse list
- `ROSTER` (cycle 5) for the panel's dino list/order — reuse, no re-listing names.
- `Dino.name` + `Dino.traits` (cycle 4) for the greet gain — reuse.
- `saveToDb`/`loadFromDb` + `currentSaveData`/`saveGame` (cycle 3) — extend, don't duplicate; affinity rides the existing save path.
- `nearestDino()` + the existing `handleInteract` greet flow — hook the bump in, don't fork the flow.
- `__clockNow` dev-hook pattern; clock HUD / night overlay as the model for an in-`WorldScene` text panel.

## New dependencies
none.

## Test plan
### Unit (vitest) — `tests/unit/friendship.test.ts`
- `heartsFromPoints`: 0→0, 35→3, 100→10, 105→10, −5→0.
- `bumpPoints` clamps [0,100] and does not mutate input (assert original unchanged).
- `heartString(h)` length 10, exactly `h` `♥`.
- `greetGain(undefined) === BASE_GAIN`; `greetGain(warm+social) > greetGain(prickly+solitary)`; both ≤ 10.
- save: `deserialize(serialize({...,friendship:{Rex:30}}))` round-trips friendship; a v1 object literal without `friendship` → `deserialize` yields `friendship === {}`.
### E2E (playwright) — `tests/e2e/cycle-006-hearts.spec.ts`
- `__greet('Rex')` then `__hearts()['Rex'] >= 1`; reload → still ≥ 1 (persistence).
- `__heartsPanelVisible()` false → press **C** → true → press **C** → false.
- cycle-2/3/4/5 suites stay green (esp. cycle-3 save still restores time/player with the new field present).

## Risks
- **Save back-compat:** a cycle-3 save (no `friendship`) must still load. `deserialize` defaults the field to `{}`; covered by a unit test. Existing cycle-3 e2e save tests must still pass (they write/read v1 saves that now also carry `friendship: {}`).
- **Panel depth:** HUD is depth 10, night overlay depth 5 — put the panel at depth 11 so it sits above both and isn't dimmed at night.
- **Glyph width in tests:** assert on `heartString` length/counts, not pixel width; the panel itself isn't pixel-asserted.
- **Double-save chatter:** greet triggers an immediate save and the hourly autosave still runs — both write the same key, last-writer-wins, harmless.

## Estimated touch count
5 files (1 new src, 2 modified src, 1 new unit, 1 new e2e). Under the ceiling. Save round-trip test folded into `friendship.test.ts`; `saveGame.test.ts` left as-is (and must stay green with the additive field).
