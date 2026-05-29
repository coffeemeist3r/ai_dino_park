# Cycle 3 — Design

## Item
BACKLOG-009 [core] Save / load via IndexedDB — auto-save every in-game hour, manual export to JSON.

## Why this cycle
The park resets on every refresh. This cycle makes it persistent: the in-game time and player position survive a reload via IndexedDB, auto-saved on each in-game hour, with a manual JSON export. It's the last core-loop foundation and the spine every later stateful feature (affinity, hearts, eggs) will write into.

## What ships
On boot the game reads IndexedDB. If a save exists, it restores the in-game day/hour/minute and the player's tile position; the clock HUD and day/night tint reflect the restored time immediately. If no save exists, it boots fresh (Day 1, 08:00, default player spot). Every time the in-game clock crosses an hour, the game silently auto-saves. Pressing **E** exports the current save as a downloaded `dino-save.json` file.

QA verifies via dev-only `window` hooks (same pattern as `__clockNow`):
- `window.__saveNow()` → forces a save, returns the saved `SaveData`.
- `window.__exportSave()` → returns the current state serialized to a JSON string.
- `window.__advanceMinutes(n)` → ticks the clock `n` in-game minutes (so an hour boundary, hence auto-save, can be crossed without waiting 60 real seconds).
- `window.__playerPos()` → `{ x, y }` of the player.
- `window.__clockNow()` (already exists) → restored time after reload.

## Acceptance criteria
- [ ] `serialize(state)` → `deserialize(json)` round-trips `{ version, time, player }` exactly (unit).
- [ ] `deserialize` returns `null` for malformed JSON, a non-object, or a missing/!=1 `version` — no throw (unit).
- [ ] Fresh boot with no save (DB cleared) starts at Day 1, 08:00, default player position, no console error (e2e).
- [ ] After `__advanceMinutes(65)` (crosses 09:00, triggering auto-save) then page reload, `__clockNow()` reports hour 9 (e2e).
- [ ] After moving the player, `__saveNow()`, and reload, `__playerPos()` matches the pre-reload position within 1px (e2e).
- [ ] `__exportSave()` returns a JSON string that parses to an object with numeric `version`, a `time` object, and a `player` object (e2e).
- [ ] Restored boot updates the clock HUD text and day/night tint to the restored hour (e2e: reload into a night hour → `__readTint().alpha` ≥ 0.45).
- [ ] No regression: Z dialog with Rex, clock ticking, and day/night overlay all still work (e2e smoke suite green).
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- Save **migration** across versions — ship only a `version: 1` field as a seam. Migration is BACKLOG-040.
- Importing a JSON file back in (export only this cycle).
- Persisting NPC/dino state beyond what exists today (dinos are static; nothing mutable to save yet).
- Multiple save slots, cloud sync, compression.

## Constraints
- Reuse the existing `WorldClock` singleton (`getWorldClock`, `onHour`, `now`). Add a `set(time)` method to restore — do not create a parallel clock.
- Pure serialize/deserialize must live in a no-Phaser, no-IndexedDB module so it is Node-unit-testable (mirror `clock.ts` / `dayNight.ts`). The IndexedDB I/O is a separate thin async module, verified by e2e.
- No new npm dependencies (no `fake-indexeddb`, no `idb` wrapper) — use the raw IndexedDB API.
- Must not break Z dialog, clock HUD, or day/night overlay.
- TypeScript strict; `any` only via the documented dev-hook pattern already in `WorldScene`.
