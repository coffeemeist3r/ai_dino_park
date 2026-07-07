# Cycle 94 — Code Plan

## Lore track — BACKLOG-414: A ritual for the missing friend

**Item:** Grieving dino aims its solitary tic at the edge its closest cross-zone friend left by.

**Files to create:**
- `tests/unit/cycle-094-grief-tic.test.ts` — griefEdge / griefAnchor / griefTicMemory + closestFriend.
- `tests/e2e/cycle-094-grief-tic.spec.ts` — grief-aimed tic + non-grief control.

**Files to modify:**
- `game/src/world/tic.ts` — add `griefEdge(dinoZone, friendZone): Edge|null` (chain-direction toward
  the friend's zone), `griefAnchor(edge, row, cols): Tile` (west→col 0, east→last col), `griefTicMemory(label, friend): string`, and `GRIEF_BOND_FLOOR = 8`. Import `zoneChain`, `type Edge` from `./zones`.
- `game/src/social/bonds.ts` — add `closestFriend(name, bonds, others, floor=0): string|null` (highest
  pairwise bond above floor, lexicographic tie-break). Extracted 013 primitive `comfort.ts` inlines today.
- `game/src/scenes/WorldScene.ts`:
  - import `griefEdge, griefAnchor, griefTicMemory, GRIEF_BOND_FLOOR` from `../world/tic`; `closestFriend` from `../social/bonds`.
  - new field `private ticGrief: Record<string, string | null> = {};`
  - new method `private griefFor(d): { edge: Edge; friend: string } | null` — closestFriend above floor, its zone ≠ dino's zone → `{ edge: griefEdge(dz,fz), friend }`.
  - tic block (~L2396): on first ticcing step (anchor undefined), set `ticGrief[name]` + anchor =
    grief ? `griefAnchor(edge, cur.tileY, COLS)` : cur. Then `next = atAnchor ? ticStep(...) : stepToward(cur, anchor, COLS, ROWS)` — the dino *walks* to the grief edge, then rituals (non-grief anchor===cur so byte-identical).
  - `performTic` (~L2260): file `griefTicMemory(label, friend)` + directional event line when `ticGrief[name]` set, else the plain `ticMemory`.
  - `resetTic` (~L2246): `delete this.ticGrief[name];`
  - new hook `__griefTic(name)` → `{ grief: griefFor(d), anchor: ticAnchor[name]??null, grieved: ticGrief[name]??null }`.

**Reuse list:** `ticStep`/`signatureTic`/`ticMemory`/`performTic` (tic.ts, 405), `stepToward` (movement),
`zoneChain`/`zoneOf`/`type Edge` (zones), `bondPoints` (bonds), `remember` (memory), `this.dinoNames()`,
`this.tileOf(d)`. No new symbol duplicates existing logic — `closestFriend` is the 013 pick `comfort.ts`
currently inlines (left as-is; not refactoring comfort this cycle).

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-094-grief-tic.test.ts`): griefEdge bowl→grove='east', grove→bowl='west', bowl→fernreach='east',
  same-zone=null, off-chain=null; griefAnchor west/east tiles; griefTicMemory contains friend + label;
  closestFriend picks highest bond, respects floor, tie-break, null when none.
- E2E (`cycle-094-grief-tic.spec.ts`): boot (ambient paused), set a strong bond Rex↔Twitch, `__migrate` Twitch
  to grove, drive Rex solitary via `__stepWorld` loop until `__tic(Rex).invented`, assert `__griefTic(Rex).anchor.tileX === COLS-1` (east edge) + a grief memory names Twitch. Control: closest friend stays in bowl → anchor not at an edge, plain memory.

**Risks:** The grieving dino must WALK to the edge (stepToward), not teleport — the atAnchor guard handles it.
`griefFor` uses `closestFriend` over ALL dinos (not just present), so a friend already in another zone still
counts. Since ambient is now paused in e2e (431), the grief spec must drive solitude with `__stepWorld`
explicitly (it does).

**Estimated touch count:** ~6 files.

## Structure track — BACKLOG-431: Pause ambient timers in e2e

**Item:** `__pauseAmbient()` freezes the wall-clock background timers; wired into e2e `boot()`.

**Files to create:**
- `tests/e2e/cycle-094-pause-ambient.spec.ts` — pause freezes wander, explicit step still works, resume re-arms.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`:
  - new field `private ambientPaused = false;`
  - L2071 wander: `callback: () => { if (!this.ambientPaused) this.forceStep(); }`
  - L1353 sky roll: `callback: () => { if (!this.ambientPaused) this.maybeStartSky(); }`
  - L3500 migration roll: `callback: () => { if (!this.ambientPaused) this.maybeMigrate(); }`
  - hooks: `__pauseAmbient = () => { this.ambientPaused = true; }`, `__resumeAmbient = () => { this.ambientPaused = false; }`, `__ambientPaused = () => this.ambientPaused`.
- `tests/e2e/helpers.ts` — after the `__ready` wait, `await page.evaluate(() => (window as ...).__pauseAmbient())`.

**Reuse list:** the existing `window.__*` hook pattern and `this.time.addEvent` callbacks — only the callback
bodies gain a flag check. Explicit hooks (`__stepWorld`→`forceStep`, `__triggerSky`→`startSky`,
`__migrate`/`__maybeMigrate`, `__maybeBarter`/`__edgeBarter`, `__advanceWall`→clock) already call the
underlying methods directly, so they bypass the gate unchanged.

**New dependencies:** none.

**Test plan:**
- E2E (`cycle-094-pause-ambient.spec.ts`): after boot `__ambientPaused()===true`; positions unchanged over a
  >3s wait (one WANDER_STEP_MS=3000 window) with no explicit step; `__stepWorld()` still moves the cast;
  `__resumeAmbient()` → `__ambientPaused()===false`.
- Regression: the WHOLE existing e2e suite must stay green with boot() pausing ambient. Any spec that relied on
  the auto-timers (rather than explicit stepping) surfaces here.

**Risks:** Gating `boot()` for all specs is broad. Mitigation: the gate is in the timer *callbacks* only, and
every spec drives beats via explicit hooks (verified: movement specs use `__stepWorld`, sky uses `__triggerSky`,
migration uses `__migrate`, barter uses `__maybeBarter`, chorus uses `__advanceWall`). Dawn-chorus / season /
reflection `onHour` listeners are NOT gated (inert in short specs; gating breaks cycle-045-chorus). QA runs the
full suite to confirm no fallout.

**Estimated touch count:** ~3 files.

**Cross-track collision:** none — lore touches the tic block/`performTic`/`resetTic`/tic+bonds modules; structure
touches the three timer callbacks + hooks + `helpers.ts`. Different regions of WorldScene, no shared lines.
