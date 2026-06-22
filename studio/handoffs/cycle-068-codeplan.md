# Cycle 68 — Code Plan

Both tracks are small, additive, and touch disjoint code. Land lore first (tiny, pure), then structure.

---

## Lore track — BACKLOG-306: In-character homecoming

### Files
- `game/src/world/homecoming.ts` (edit) — thread the homecomer's quirk into its line.
- `game/src/scenes/WorldScene.ts` (edit, ~2 lines) — supply the quirk lookup at the two `homecoming(...)` call-sites (3097, 3135).
- `game/src/world/homecoming.test.ts` (edit/add) — quirk cases + omitted-arg byte-identity.
- `game/tests/*.spec.ts` (add 1 e2e) — homecoming bubble carries a quirk label.

### Changes
1. `homecomingLine(name, hearts, quirk?)` — gains an optional `quirk` label. When present, prepend a body-language clause: ``return `${name} ${quirk} — ${spoken}`;`` where `spoken` is the current tier string (keep the three tier strings byte-identical as the suffix). When absent → return exactly the current strings (so the cycle-30 spec, which calls with no quirk, is byte-identical).
   - Example outputs: `Rex paces — You're finally back! 👋`, `Twitch peeks around timidly — Oh — you're back. 👋`.
2. `homecoming(friendship, awayMinutes, quirkLabel?: (name: string) => string | undefined)` — optional last param. After `best` is picked: `const q = quirkLabel?.(best.name); ... line: homecomingLine(best.name, hearts, q)`. The `jealous` line and `memory` are untouched.
3. WorldScene call-sites: pass `(name) => { const d = this.dinos.find((x) => x.name === name); return d ? fidget(d.traits).label : undefined; }`. Import `fidget` from `../world/fidget`. (`Dino.traits` is the `Personality` already used at the feed/scan sites.)

### Reuse (no new modules)
- `fidget()` (world/fidget.ts) — the exact label the book (303) and live glyph (298) use; agreement is free.
- Existing `playHomecoming` → `showBubble` render path is unchanged (it just shows `hc.line`).

### Test plan
- Unit (`homecoming.test.ts`): (a) with a quirk lookup, the returned `line` contains the stub label + name + `👋`; (b) two dinos with different labels → different lines; (c) **no** lookup arg → the line is exactly the pre-existing tier string (lock all three tiers); (d) the lookup returning `undefined` for the homecomer → also the plain string.
- E2E: seed friendship + a long away gap (the existing homecoming e2e harness/hook), trigger the homecoming, assert the bubble text matches `/<name>.*(paces|peeks|pokes|hums|grumbles|bounces|dozes|stands|looks for company|keeps to itself).*👋/` for the known homecomer, and that `__greet`/book label agrees.

---

## Structure track — BACKLOG-274: Populate the grove

### Files
- `game/src/world/zones.ts` (edit) — add `otherZone(id)` helper (pure).
- `game/src/world/saveGame.ts` (edit) — `dinoZones?: Record<string,string>` additive field (mirror `roles` exactly).
- `game/src/scenes/WorldScene.ts` (edit) — persist/restore `dinoZones`; gate the three interaction find-sites on `inView`; add the migration roll + `__migrate` hook + reposition.
- `game/src/world/zones.test.ts` + `game/src/world/saveGame.test.ts` (edit/add) — `otherZone`, dinoZones round-trip + old-save default.
- `game/tests/*.spec.ts` (add 1 e2e) — migrate → hidden + un-greetable in bowl; cross to grove → visible + greetable; persists across reload.

### Changes
1. **`zones.ts`:** `export function otherZone(id: string): string { return id === GROVE_ID ? BOWL_ID : GROVE_ID; }` (bowl for any non-grove id, symmetric with `zoneById`'s fallback).
2. **`saveGame.ts`:** add `dinoZones?: Record<string, string>;` to `SaveData` (doc: "Additive; absent → {} (every dino defaults to the bowl)"). In `deserialize`, copy the `roles` validation block verbatim for `dinoZones` (string values only, malformed → null). Add `dinoZones` to the return object.
3. **WorldScene persist/restore:**
   - `currentSaveData()`: add `dinoZones: this.dinoZones,`.
   - In the deserialize-apply block (beside `this.gathered = save.gathered ?? {}`): `this.dinoZones = save.dinoZones ?? {};`. Keep the existing `this.dinoZones[cfg.name] ??= BOWL_ID;` spawn default (line 1014) so any dino absent from a save (or a fresh game) defaults to the bowl — **spawn stays byte-identical**.
4. **Proximity-interaction filter** — gate each find on the existing `inView`:
   - `nearestDino()` (2818): `for (const d of this.dinos) { if (!this.inView(d)) continue; ... }` (covers greet/tone menu **and** scan, both call `nearestDino`).
   - `checkFeeding()` (721): `this.dinos.find((d) => this.inView(d) && reachedFood(this.tileOf(d), this.food!))`.
   - `checkGather()` (794): `this.dinos.find((d) => this.inView(d) && reachedFood(this.tileOf(d), this.resource!))`.
5. **Migration** (mirror the sky-event cadence discipline — `WorldScene.ts:854-885`):
   - New field `private lastMigrationDay = -1;` and a const `MIGRATE_ROLL_INTERVAL_MS` (reuse/sibling of `SKY_ROLL_INTERVAL_MS`; a long real-time cadence so a short e2e never trips it).
   - `setupMigration()` (called from create, after dinos spawn): `this.time.addEvent({ delay: MIGRATE_ROLL_INTERVAL_MS, loop: true, callback: () => this.maybeMigrate() });` plus the `__migrate` hook.
   - `maybeMigrate()`: guard `if (getWorldClock().now().day === this.lastMigrationDay) return;` (≤1/in-game-day), then a low `Math.random()` chance; on success pick a random dino and `this.relocate(dino, otherZone(zoneOf(this.dinoZones, dino.name, BOWL_ID)))`; set `lastMigrationDay`.
   - `relocate(dino, destZoneId)`: `setZone(this.dinoZones, dino.name, destZoneId)`; reposition the dino to an interior tile of the destination away from the linked edge (e.g. a random column in `[2, COLS-3]`, random row in `[2, ROWS-3]`, → pixel center); `this.applyZoneVisibility()`; `void this.saveGame()`; `this.logEvent('🌿 ' + dino.name + (destZoneId === GROVE_ID ? ' wandered into ' + zoneById(GROVE_ID).name : ' wandered back to the bowl'))`.
   - `__migrate(name, zoneId)` dev hook: `const d = this.dinoByName(name); if (d) this.relocate(d, zoneId); return zoneOf(this.dinoZones, name, BOWL_ID);`.
   - The roll uses real-time cadence + per-day cap, never fires on `clock.set()` (no `onHour`), so boot/restore/away can't migrate (matches the sky-event safety note).

### Reuse (no new occupancy primitive)
- `inView`, `applyZoneVisibility`, `zoneOf`/`setZone`, `zoneById`, `dinoByName`, `tileOf`, `logEvent`, `saveGame` — all exist.
- The save-validation shape is copied from the shipped `roles` block (string-valued record).

### Test plan
- Unit (`zones.test.ts`): `otherZone(BOWL_ID)===GROVE_ID`, `otherZone(GROVE_ID)===BOWL_ID`, `otherZone('x')===BOWL_ID`.
- Unit (`saveGame.test.ts`): a save with `dinoZones` round-trips; a save **without** it deserializes with `dinoZones === {}`; a malformed `dinoZones` (non-string value) → `null`.
- E2E (new spec): boot → all 5 in bowl (`__visibleDinos` length 5). `__migrate('Mossback','grove')` → Mossback invisible, `__visibleDinos` excludes it, and a greet aimed at its tile finds a different/no dino. `__tryCross` east → in the grove, `__visibleDinos` includes Mossback, greet beside it opens the tone menu. Save+reload → Mossback still in grove. Drop food in the bowl with a grove dino positioned on the landing tile → it does **not** eat (off-zone).
- Guard: a control assertion that with no `__migrate`/no roll, the existing bowl cast is intact (covered by the untouched 215 e2e + the spawn-byte-identical default).

### Blockers
- None anticipated. Watch: the migration roll constant must be long enough that a full `playwright test` run (minutes) won't randomly migrate a founder mid-spec — set `MIGRATE_ROLL_INTERVAL_MS` ≥ the sky interval and keep the chance low; tests drive migration through `__migrate`, not the roll.

---

## SHIPPED (coder)

**306:** `homecoming.ts` — `spokenLine` (old tiers) + `homecomingLine(name,hearts,quirk?)` prepend; `homecoming()` gained optional `quirkLabel` lookup; WorldScene `dinoQuirkLabel()` + both call-sites pass it. **274:** `zones.ts` `otherZone`; `saveGame.ts` additive `dinoZones` (validation mirrors `roles`); WorldScene persist/restore, `inView` gate on `nearestDino`/`checkFeeding`/`checkGather`, `setupMigration`/`maybeMigrate`/`relocate` (sky-cadence roll + per-day cap) + `__migrate` + `__nearestDino` hooks. Build clean; 687/687 unit; targeted e2e (068×2 + 030 + 059) 9/9 green. Full e2e bar runs in QA.
