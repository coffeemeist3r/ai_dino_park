# Cycle 72 — Code Plan

## Structure track — BACKLOG-333 (Realtime liveliness)

**Files to create:** `tests/unit/cycle-072-cooldown.test.ts`, `tests/e2e/cycle-072-liveliness.spec.ts`

**Files to modify:**
- `game/src/world/clock.ts` — add pure `export function cooldownReady(nowMs, lastMs, cooldownMs): boolean` (`nowMs - lastMs >= cooldownMs`).
- `game/src/scenes/WorldScene.ts` —
  - module consts: add `WANDER_STEP_MS = 3000`, `MIGRATE_COOLDOWN_MS = 60_000`.
  - `setupMovement`: replace the `getWorldClock().onTick(() => { if (++this.moveTicks % 5 === 0) this.forceStep(); })` with `this.time.addEvent({ delay: WANDER_STEP_MS, loop: true, callback: () => this.forceStep() })`. Drop the `moveTicks` field.
  - migration: add `private lastMigrationMs = 0;`, drop `lastMigrationDay`. `maybeMigrate`: `if (!cooldownReady(Date.now(), this.lastMigrationMs, MIGRATE_COOLDOWN_MS)) return;` then the existing `MIGRATE_CHANCE` roll + relocate, set `this.lastMigrationMs = Date.now()`.
  - hooks: `__wanderStepMs = () => WANDER_STEP_MS;`, `__migrateCooldownMs = () => MIGRATE_COOLDOWN_MS;`.

**Reuse list:** `forceStep` (unchanged body), `relocate`/`otherZone`/`zoneOf` (unchanged), `this.time.addEvent` (Phaser scene timer, same as the existing migration roll), `cooldownReady` (new, clock.ts).

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-072-cooldown.test.ts`): `cooldownReady` true at/after the interval, false before.
- E2E (`cycle-072-liveliness.spec.ts`): `__wanderStepMs()` ≤ 5000; `__migrateCooldownMs()` ≤ 300000; `__stepWorld()` still relocates dinos (forceStep intact); zero console errors.

**Risks:** `forceStep` must stay behaviourally identical — only its *driver* changes. Existing specs call `forceStep` via `__stepWorld` so they're unaffected. The 60× toggle (T) is independent and stays.

**Estimated touch count:** ~4 files.

---

## Lore track — BACKLOG-325 (Lingering lift)

**Files to create:** `tests/e2e/cycle-072-lingering-lift.spec.ts`

**Files to modify:**
- `game/src/scenes/WorldScene.ts` —
  - module const `LIFT_WINDOW_MS = 8000`; field `private liftedUntil: Record<string, number> = {}`.
  - `liftMood(d)`: also `this.liftedUntil[d.name] = Date.now() + LIFT_WINDOW_MS;`.
  - `refreshActivityMarks`: for a `wandering` dino with no mood and `Date.now() < (this.liftedUntil[name] ?? 0)`, render `reliefFlourish(d.traits)` instead of `moodFidget(...).glyph` (sulk/mood still wins).
  - hooks: `__lifted = (name) => Date.now() < (this.liftedUntil[name] ?? 0);` and `__liftMood = (name) => { const d = this.dinoByName(name); if (d) this.liftMood(d); return (this as any).lastMoodLift; };`.

**Reuse list:** `reliefFlourish`/`moodFidget`/`fidget` (fidget.ts, shipped), `liftMood`/`lastMoodLift` (318), `refreshActivityMarks` render site, `__activityMark` hook (read in the e2e).

**New dependencies:** none.

**Test plan:**
- E2E (`cycle-072-lingering-lift.spec.ts`): `__lifted(name)` false at boot; after `__liftMood(name)`, `__lifted(name)` true and `__activityMark(name)` ends with `✨` (perked); zero console errors.

**Risks:** the perk must yield to mood shading (a sulk shows 😒, not the perk). Order the render check mood-first.

**Estimated touch count:** ~2 files.

---

## Cross-track collision

Both in `WorldScene`, disjoint methods. Build order: 333 (driver rewire + migration
cooldown) first, then 325 (`liftMood` window + `refreshActivityMarks` perk). `clock.ts`
gets `cooldownReady`; `fidget.ts` is already shipped (no change).
