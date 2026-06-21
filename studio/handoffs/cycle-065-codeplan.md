# Cycle 65 — Code Plan (both tracks)

## Lore track — BACKLOG-295 Dino activity readout

**Item:** a per-dino glyph showing current intent, read off the `forceStep` precedence ladder.

**Files to create:**
- `game/src/world/activity.ts` — pure:
  - `export type Activity = 'gazing'|'inspecting'|'responding'|'feeding'|'huddling'|'gathering'|'socializing'|'wandering';`
  - `export const ACTIVITY_GLYPH: Record<Activity,string> = { gazing:'✨', inspecting:'👀', responding:'🆘', feeding:'🍖', huddling:'💤', gathering:'🪵', socializing:'💬', wandering:'🚶' };`
  - `export interface ActivityFlags { gazing:boolean; inspecting:boolean; responding:boolean; feeding:boolean; huddling:boolean; gathering:boolean; socializing:boolean; }`
  - `export function dinoActivity(f: ActivityFlags): Activity` — return the first true flag in precedence order, else `'wandering'`.

**Files to modify:**
- `game/src/scenes/WorldScene.ts`
  - import `dinoActivity, ACTIVITY_GLYPH, type Activity` from `../world/activity`.
  - new fields: `private activityMarks: Phaser.GameObjects.Text[] = [];` and `private activityById: Record<string, Activity> = {};`
  - in `spawnDino` (beside the `sleepMarks.push(...)` ~line 883): push an index-aligned activity mark — `this.add.text(0,0,'',{ fontSize:'12px' }).setOrigin(0.5,1).setDepth(12).setVisible(false)`.
  - in `forceStep`'s per-dino move loop: as each branch is taken, record the realized flags and store the activity. Set `this.activityById[d.name] = dinoActivity({...})` for every dino:
    - the `pendingInspect` branch → `inspecting:true` (before its `continue`);
    - the `pendingRespond` branch → `responding:true` (before `continue`);
    - the food-rush branch → `feeding:true` (before `continue`);
    - the else-if chain → `huddling` / `gathering` / `socializing` (the realized `other && rand<0.45`) / `wandering`. Capture the same `rand<0.45` result used for movement so the social/wander split matches what the dino actually did.
  - in the sky early-return branch (`if (this.stepSky()) {`): set `this.activityById[d.name]=dinoActivity({...gazing:true})` for every dino (or a simple loop assigning `'gazing'`), then `this.refreshActivityMarks()` before `return`.
  - new `private refreshActivityMarks()` — mirror `refreshSleepMarks`: for each dino at index i, if `this.isHuddling(d)` (the 💤 sleep mark owns that slot) or `!this.inView(d)` → hide; else set the mark text to `ACTIVITY_GLYPH[this.activityById[d.name] ?? 'wandering']` and show at `d.y - TILE` (same slot as 💤, mutually exclusive with it; cold 🥶 stays at `-TILE*1.4`).
  - call `this.refreshActivityMarks()` at the end of `forceStep` (after the meet loop), and in the sky branch (above).
  - dev hook (near `__huddlers` ~line 916): `(window as any).__activity = (name:string) => this.activityById[name] ?? null;`

**Reuse list (MUST use):**
- the index-aligned per-dino mark pattern — `sleepMarks`/`coldMarks` + `refreshSleepMarks`/`refreshColdMarks` (do not invent a new overlay system).
- `isHuddling` / `inView` — existing gates.
- the precedence lives ONLY in pure `dinoActivity` — the loop passes realized flags, doesn't re-implement the ladder.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-065-activity.test.ts`: `dinoActivity` returns each state for the right flag and honors precedence (gazing beats all; feeding beats huddling; huddling beats gathering; gathering beats socializing; all-false → wandering); `ACTIVITY_GLYPH` has a glyph for every `Activity`.
- E2E `tests/e2e/cycle-065-activity.spec.ts`: boot; an idle dino reads `__activity` `'wandering'`; `__triggerSky('meteors')` + step → every dino reads `'gazing'`; spawn a resource on a curious dino and step → it reads `'gathering'`. `errors` empty.

**Risks:** the social/wander split is a per-step coin flip — capture the realized boolean in the loop, don't re-roll in `refreshActivityMarks` (that would desync glyph from movement). Don't double-render 💤: suppress the activity glyph while `isHuddling`. Keep `activity.ts` free of any ai/ import.

**Estimated touch count:** ~2 files (+2 test files).

---

## Structure track — BACKLOG-297 Legible gathering

**Item:** a resource lingers before it's fetched + a spawn note + a rate bump.

**Files to create:** none.

**Files to modify:**
- `game/src/world/resource.ts`
  - bump `RESOURCE_SPAWN_CHANCE` `0.05` → `0.12`.
  - add `export const RESOURCE_GRACE_STEPS = 3;` and pure `export function resourceFetchable(ageSteps: number): boolean { return ageSteps >= RESOURCE_GRACE_STEPS; }`.
- `game/src/scenes/WorldScene.ts`
  - import `resourceFetchable, RESOURCE_GRACE_STEPS` from `../world/resource`.
  - new field `private resourceAge = 0;`
  - at the top of `forceStep` (after the sky early-return): `if (this.resource) this.resourceAge++;`
  - gate the fetch-movement branch (~line 1446): `} else if (this.resource && resourceFetchable(this.resourceAge) && noticeResource(d.traits.curiosity, resDist) === 'fetch') {`
  - gate the pickup in `checkGather`: bail until fetchable — `if (!this.resource || !resourceFetchable(this.resourceAge)) return;` (keep the rest).
  - in `maybeSpawnResource` after `spawnResource(...)`: `this.resourceAge = 0;` and `this.logEvent(\`${RESOURCE_GLYPH[kind]} a ${kind} fell\`);` (kind is `pickKind()` — capture it).
  - in the `__spawnResource` dev hook: add an optional `fresh` param — `__spawnResource(kind,tileX,tileY,fresh=false)` → `this.spawnResource(...); this.resourceAge = fresh ? 0 : RESOURCE_GRACE_STEPS;`. Default (existing callers) → already past grace, so cycle-062/063/064 e2e are unaffected.

**Reuse list (MUST use):**
- `RESOURCE_GLYPH` / `pickKind` / `rollResource` / `noticeResource` — existing `resource.ts` (don't reimplement spawn/notice).
- `logEvent` — existing WorldScene log path.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-065-gather-grace.test.ts`: `resourceFetchable` false for ages `0..GRACE-1`, true at `GRACE` and above; `RESOURCE_SPAWN_CHANCE` equals the new value (pins the bump).
- E2E `tests/e2e/cycle-065-gather-grace.spec.ts`: spawn a resource **fresh** (`__spawnResource('branch', tx, ty, true)`) on a curious dino; step once → it is NOT yet banked (stockpile unchanged, resource still present); step through `RESOURCE_GRACE_STEPS` → then it banks. Confirms the linger. `errors` empty.

**Risks:**
- **Existing resource/craft/stockpile e2e** rely on an immediate pickup via `__spawnResource` → preserved by defaulting `fresh=false` (age = grace). Verify cycle-062/063/064 specs still green.
- Increment `resourceAge` exactly once per `forceStep` and before the move loop reads it; reset to 0 only on a *natural* spawn. A dev-`fresh` spawn starts at 0 too (to test grace).
- **Cross-track collision:** both tracks edit `WorldScene.ts`. Disjoint methods — lore: `spawnDino`/`forceStep` activity capture + `refreshActivityMarks` + `__activity`; structure: `forceStep` top increment + the fetch-branch gate + `checkGather` + `maybeSpawnResource` + `__spawnResource`. Both touch `forceStep` but different lines (structure: the top increment + the `else if` fetch condition; lore: the activity capture in each branch + the trailing refresh). Apply structure first (the fetch-gate condition), then lore (wrap each branch with the activity capture), build once.

**Estimated touch count:** ~2 source (`resource.ts`, `WorldScene.ts`) + 2 test. Combined cycle: `activity.ts`, `resource.ts`, `WorldScene.ts` = 3 source + 4 test.

---

## Shipped (Coder)

**Files touched:**
- `game/src/world/activity.ts` (new) — pure `Activity` union + `ACTIVITY_GLYPH` + `dinoActivity(flags)` (295).
- `game/src/world/resource.ts` — `RESOURCE_SPAWN_CHANCE` 0.05→0.12, `RESOURCE_GRACE_STEPS=3`, pure `resourceFetchable(age)` (297).
- `game/src/scenes/WorldScene.ts` — 295: `activityMarks`/`activityById`, mark created in `spawnDino`, activity captured per branch in `forceStep` (incl. gazing in the sky branch), `refreshActivityMarks()` (suppressed while huddling so 💤 isn't doubled), `__activity` hook. 297: `resourceAge` (incremented at `forceStep` top, reset on natural spawn), fetch-branch + `checkGather` gated on `resourceFetchable`, "a branch fell" log on natural spawn, `__spawnResource(...,fresh=false)` (default already past grace → older specs unaffected).
- Tests: unit `cycle-065-activity.test.ts`, `cycle-065-gather-grace.test.ts`; e2e `cycle-065-activity.spec.ts`, `cycle-065-gather-grace.spec.ts`.

**Deviations from plan:** none material. The `forceStep` else-chain computes the `huddling`/`gathering`/`socializing` booleans once and feeds them to both movement and `dinoActivity` (single source — the glyph can't disagree with the move).

**Build + test status:** `npm run build` clean; **629 unit** green; **206 e2e** green (full run; cycle-065 specs hit the catalogued cold-boot flake on the first cold parallel run, green warm + stable ×3 repeats); dev HTTP 200. No new dependencies; `@mlc-ai/web-llm` boundary untouched (`activity.ts`/`resource.ts` are pure, no ai/ import).
