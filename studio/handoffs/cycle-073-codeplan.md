# Cycle 73 — Code Plan

**Cross-track collision:** both tracks edit `WorldScene.ts` only, in disjoint spots —
334 adds a migration-walk branch high in `forceStep`'s per-dino loop + a new `crossDino`
/ rewired `maybeMigrate`; 181 adds a `maybeMurmur()` call at the **tail** of `forceStep`
+ a new method. No shared lines. **Order: 334 first, then 181.** Both pure modules are
new files (`zones.ts` is extended, `murmur.ts` is new) — no overlap there.

---

## Structure track — BACKLOG-334

**Item:** Visible zone crossing — the ambient migrant walks to the linked edge and crosses
instead of teleporting.

**Files to create:** none.

**Files to modify:**
- `game/src/world/zones.ts` — add three pure helpers (origin-zone-keyed; only bowl↔grove this spine):
  - `migrationStepTarget(homeZone, row, cols)` → `{tileX,tileY}`: the linked-edge tile in the current zone (`bowl`→`{cols-1,row}`, `grove`→`{0,row}`) the migrant walks toward.
  - `atMigrationEdge(homeZone, tile, cols)` → `boolean`: arrived (`bowl`→`tile.tileX >= cols-1`, `grove`→`tile.tileX <= 0`).
  - `crossEntryTile(homeZone, row, cols)` → `{tileX,tileY}`: entry tile in the **dest** zone, one in from the opposite edge (`bowl`(→grove)→`{1,row}`, `grove`(→bowl)→`{cols-2,row}`), mirroring `linkedZone`'s entries.
- `game/src/scenes/WorldScene.ts`:
  - New field `private migrating = new Set<string>();` (transient, not persisted).
  - `maybeMigrate()` — pick a dino **not already** in `migrating`; instead of `relocate`, call `this.startMigration(d)`; set `lastMigrationMs` only when one actually starts.
  - New `private startMigration(d: Dino)` — `this.migrating.add(d.name)` (no zone flip yet).
  - `forceStep()` per-dino loop — new branch right **after** the `pendingRespond` block, **before** the food block: if `this.migrating.has(d.name)`, then if `atMigrationEdge(home, cur, COLS)` → `this.crossDino(d)`, else `stepToward(cur, migrationStepTarget(home, cur.tileY, COLS), COLS, ROWS)` + `setPosition` + `activityById[d.name]='wandering'`; `continue` either way. (`home = zoneOf(this.dinoZones, d.name, BOWL_ID)`.)
  - New `private crossDino(d: Dino)` — flip `setZone(dinoZones, name, otherZone(home))`, `setPosition` to `crossEntryTile(home, cur.tileY, COLS)`, `migrating.delete(name)`, `applyZoneVisibility()`, `logEvent('🌿 … crossed into The Grove' / 'crossed back to the bowl')`, `void saveGame()`.
  - `setupMigration()` — add hooks: `__startMigration(name)` (start the walk, return its current zone) and `__migrating()` (`[...this.migrating]`). Leave `__migrate` (instant `relocate`) untouched.

**Reuse list (MUST use, do not reinvent):**
- `game/src/world/zones.ts`: `setZone`, `zoneOf`, `otherZone`, `zoneById`, `BOWL_ID`/`GROVE_ID` — exist.
- `game/src/world/movement.ts`: `stepToward` (already imported, used by inspect/respond) — the one-tile-toward-target stepper that makes the walk monotonic.
- `relocate` stays as-is (instant) — it's the `__migrate` hook + restore path; reuse it there, don't fold it into the walk.

**New dependencies:** none.

**Test plan:**
- Unit (`tests/unit/cycle-073-migration-crossing.test.ts`): `migrationStepTarget`/`atMigrationEdge`/`crossEntryTile` for both origins — bowl targets east edge col `cols-1` & enters grove at col 1; grove targets west col 0 & enters bowl at col `cols-2`; row preserved; arrival predicate flips exactly at the edge column.
- E2E (`tests/e2e/cycle-073-crossing.spec.ts`): boot, `__setZone('bowl')`, `__startMigration('Rex')`; assert `__migrating()` contains Rex and `__zoneOf`/home still bowl; `__stepWorld()` in a loop asserting Rex's tile-x increases toward the east edge (no teleport); after enough steps assert Rex's home zone is grove, tile-x near the west entry (col 1), and `__migrating()` no longer contains Rex. Second test: `__migrate('Mossback','grove')` still flips instantly (cycle-068 parity).

**Risks:** `stepToward` may move diagonally if the target row differs — we pass `cur.tileY` as the target row so it only moves in x; verify it doesn't overshoot the edge column (it clamps via COLS-1 target, and `atMigrationEdge` uses `>=`/`<=` so an exact landing also triggers). A migrant whose home flips mid-walk while the keeper is in the far zone correctly becomes visible on arrival via `applyZoneVisibility`.

**Estimated touch count:** ~3 files (zones.ts, WorldScene.ts, + tests). Well under 6.

---

## Lore track — BACKLOG-181

**Item:** Sleep murmurs — a huddling, in-view dino floats a 💭 line drawn from its day-memory.

**Files to create:**
- `game/src/world/murmur.ts` — pure, no Phaser, no AI import:
  - `pickMurmurMemory(events: string[]): string | null` → most-recent memory (`events.at(-1) ?? null`).
  - `murmurLine(memory: string | null): string` → `null`→`'💭 …zzz…'`; else strip a leading non-alphanumeric run (`memory.replace(/^[^A-Za-z0-9]+/, '').trim()`) so a logged "🍖 ate its favorite" dreams as "💭 …ate its favorite…" — `` `💭 …${frag}…` ``.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`:
  - Add `recall` to the existing `'../ai/memory'` import (already imports `remember`,`forget`); import `pickMurmurMemory`,`murmurLine` from `'../world/murmur'`.
  - New constant near `HUDDLE_TILE`: `const MURMUR_CHANCE = 0.2;` (sparse — the den shouldn't be a wall of 💭).
  - New `private maybeMurmur(): void` — roll `MURMUR_CHANCE`; build `sleepers = this.dinos.filter(d => this.isHuddling(d) && this.inView(d))`; if any, pick one at random and `this.showBubble(d, murmurLine(pickMurmurMemory(recall(this.memory, d.name))))`.
  - Call `this.maybeMurmur()` at the **tail** of `forceStep()` (after `refreshActivityMarks()`, alongside `checkFeeding()` etc.).
  - Hooks (mirror existing `__`-hook block): `__murmur(name)` → returns the deterministic line that dino would speak now; `__forceMurmur(name?)` → bypass the chance roll, murmur the named sleeper (or a random in-view sleeper), return the line shown or `null` if none eligible — gives the e2e deterministic control.

**Reuse list (MUST use):**
- `game/src/ai/memory.ts`: `recall` — the per-dino memory ring read; do not re-walk `this.memory` by hand.
- `WorldScene.showBubble` — the shared floating-bubble (also tracked in `liveBubbles`/`__bubbleTexts`); `isHuddling` + `inView` — the existing den + zone gates.

**New dependencies:** none.

**LLM colour — deferred (deviation from the design's "What ships"):** the deterministic
murmur is shipped this cycle. The optional LLM-coloured murmur is **not** built: it would
need a murmur-specific `buildMessages` prompt in `webllmBrain.ts` and a governed night-time
brain call, and **no acceptance criterion requires it** — the charter-relevant parts (the
`NPCBrain` boundary stays intact because `murmur.ts` is pure, and the no-model path is the
shipped path) are fully satisfied by the deterministic line. Keeps the den off the GPU and
the diff short; fold the colour into 181's follow-up thread (335–337) if wanted later.

**Test plan:**
- Unit (`tests/unit/cycle-073-murmur.test.ts`): `pickMurmurMemory([])===null`; returns the last of several; `murmurLine(null)` is the zzz line; `murmurLine('🍖 ate its favorite')` is `💭`-prefixed, contains "ate its favorite", and does **not** contain the leading 🍖; two different memories → two different lines (distinctness).
- E2E (`tests/e2e/cycle-073-murmur.spec.ts`): bond Rex+Mossback, `__setClock` to winter dusk (the cycle-042 huddle setup), `__stepWorld` until `__huddlers()` includes them; `__forceMurmur('Rex')` → assert `__bubbleTexts()` contains a `💭` line; assert a non-huddling/out-of-view dino yields no murmur (`__forceMurmur` on an awake dino returns null).

**Risks:** `showBubble` dedupes by exact text (`liveBubbles` Set) — two identical murmurs in quick succession collapse to one bubble; acceptable (sparse roll). `isHuddling` already AND-gates the huddle window + den proximity, so murmurs can't fire outside the den.

**Estimated touch count:** ~3 files (murmur.ts new, WorldScene.ts, + tests). Under 6.
