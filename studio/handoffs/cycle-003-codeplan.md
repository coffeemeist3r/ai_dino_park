# Cycle 3 — Code-plan

## Item
BACKLOG-009 [core] Save / load via IndexedDB — auto-save every in-game hour, manual export to JSON.

## Files to create
- `game/src/world/saveGame.ts` — pure, no Phaser, no IndexedDB.
  - `export const SAVE_VERSION = 1`
  - `export interface SaveData { version: number; time: GameTime; player: { x: number; y: number } }`
  - `export function serialize(data: SaveData): string` — `JSON.stringify`.
  - `export function deserialize(json: string): SaveData | null` — parse + validate shape (object, `version === SAVE_VERSION`, `time` has numeric day/hour/minute, `player` has numeric x/y). Returns `null` on any failure; never throws.
- `game/src/world/saveStore.ts` — thin async IndexedDB I/O (browser only).
  - `export async function saveToDb(data: SaveData): Promise<void>`
  - `export async function loadFromDb(): Promise<SaveData | null>`
  - One DB `dino-park`, one object store `state`, fixed key `'current'`. Uses raw `indexedDB` API. `loadFromDb` returns `null` if absent or if `deserialize` rejects the stored value.
- `tests/unit/saveGame.test.ts` — unit tests for serialize/deserialize.
- `tests/e2e/cycle-003-save.spec.ts` — e2e for the IndexedDB round-trip + restore.

## Files to modify
- `game/src/world/clock.ts`
  - Add `set(t: GameTime): void { this._time = { ...t }; }` to `WorldClock` — used to restore time on load. No other change.
- `game/src/scenes/WorldScene.ts`
  - Add `setupSave()` called from `create()` after `setupDayNight()`.
  - On boot: `loadFromDb()` (async); if a save returns, `clock.set(save.time)`, move player to `save.player`, and refresh HUD text + overlay tint to the restored time.
  - `clock.onHour(() => this.saveGame())` — auto-save each in-game hour.
  - `this.input.keyboard.addKey('E')` → export: serialize current state, trigger a `Blob` download named `dino-save.json`.
  - Private `currentSaveData()` building `SaveData` from `clock.now()` + player x/y; `saveGame()` calls `saveToDb(currentSaveData())`.
  - Dev hooks (mirror `__clockNow`): `__saveNow`, `__exportSave`, `__advanceMinutes`, `__playerPos`.

## Reuse list (CHARTER demands reuse)
- `getWorldClock()`, `WorldClock.now()`, `WorldClock.onHour`, and the new `WorldClock.set()` from `clock.ts` — MUST reuse; no parallel clock.
- `tintFor()` from `dayNight.ts` + the existing `nightOverlay` field — reuse to refresh the tint after a restore (call the same path `setFillStyle(tintFor(t))`). Factor the per-tick body into a small `applyTint(t)` helper so restore and tick share it.
- The `__clockNow` dev-hook pattern in `WorldScene` — mirror exactly, including `// any: dev-only` comments.
- `GameTime` type from `clock.ts` — reused by `SaveData`.

## New dependencies
none — raw `indexedDB` browser API; CHARTER forbids adding `idb`/`fake-indexeddb`.

## Test plan
### Unit (vitest) — `tests/unit/saveGame.test.ts`
- round-trip: `deserialize(serialize(d))` deep-equals `d`.
- `deserialize('not json')` → `null` (no throw).
- `deserialize('123')` (non-object) → `null`.
- `deserialize` of an object with `version: 0` → `null` (version gate).
- `deserialize` of an object missing `player` → `null`.

### E2E (playwright) — `tests/e2e/cycle-003-save.spec.ts`
- Fresh boot: `indexedDB.deleteDatabase('dino-park')`, reload → `__clockNow()` is Day 1 08:00; no page error.
- Auto-save + restore: `__advanceMinutes(65)` (crosses 09:00 → auto-save), reload → `__clockNow().hour === 9`.
- Player position: move player a few px via `__advanceMinutes`-independent path (set position by pressing ArrowRight a few frames or via reading `__playerPos`), `__saveNow()`, reload, `__playerPos()` within 1px.
- Export: `__exportSave()` parses to an object with numeric `version`, `time` object, `player` object.
- Tint-on-restore: build a save at a night hour via `__saveNow()` after `__advanceMinutes` into night (or `__forceHour`-style), reload, `__readTint().alpha >= 0.45`.
- Regression: existing `smoke.spec.ts` + `cycle-002-daynight.spec.ts` stay green.

## Risks
- **Async load vs synchronous create():** `create()` builds the HUD/overlay at the default 08:00 synchronously and starts the clock; `loadFromDb()` resolves a moment later and overrides. A few sub-second ticks may elapse before restore — negligible, and restore explicitly re-sets time + refreshes HUD/tint. Document inline.
- **IndexedDB in unit tests:** not available in Node/jsdom — that's why serialize/deserialize is split out and IDB is e2e-only. Do not import `saveStore.ts` from a unit test.
- **Reload persistence in Playwright:** IndexedDB persists across `page.reload()` within the same browser context. Fresh-boot test MUST `deleteDatabase` first to avoid cross-test bleed; run save tests serially or scope DB clears per test.
- **Export download in headless:** the `Blob`+anchor download is hard to assert headlessly; the acceptance criterion targets `__exportSave()`'s JSON string instead. The real download is best-effort UX.
- **`set()` bypasses tick listeners:** restoring via `clock.set()` won't fire `onTick`/`onHour`; that's intended (restore is not a tick). HUD/tint refreshed explicitly after restore.

## Estimated touch count
6 files (2 new src, 2 modified src, 2 new tests) + handoff. At the ceiling, not over. No split needed — `clock.ts` change is a one-liner.

## Shipped
**Files touched:**
- `game/src/world/saveGame.ts` (new) — `SaveData`, `SAVE_VERSION=1`, `serialize`, `deserialize` (validates, returns null, never throws).
- `game/src/world/saveStore.ts` (new) — raw IndexedDB `saveToDb`/`loadFromDb` (DB `dino-park`, store `state`, key `current`).
- `game/src/world/clock.ts` (modified) — added one-line `set(t)` for restore.
- `game/src/scenes/WorldScene.ts` (modified) — `setupSave()` (load-on-boot restore, `onHour` auto-save, **E** JSON export), extracted `fmtClock()` + `applyTint()` helpers (shared by tick/restore so no logic duplicated), dev hooks `__saveNow`/`__exportSave`/`__advanceMinutes`/`__playerPos`.
- `tests/unit/saveGame.test.ts` (new) — 6 tests.
- `tests/e2e/cycle-003-save.spec.ts` (new) — 5 tests.

**Deviations from plan:** none material. Extracted `fmtClock()` to a method (planned `applyTint` refactor; `fmtClock` was the same shape and needed by restore) — strictly a dedup, no behavior change. Auto-save errors are logged via `console.error` to honor CHARTER "no silent failures."

**Build + test status:**
- `npm run build` — ✅ exit 0 (pre-existing Phaser chunk-size warning only).
- `npm run test:unit` — ✅ 20/20 (2 brain + 6 clock + 6 dayNight + 6 saveGame).
- `npx playwright test` — ✅ 10/10 (3 smoke + 2 day/night + 5 save), default config.
