# Cycle 72 — Design

Lore: BACKLOG-325 (lingering lift). Structure: BACKLOG-333 (realtime liveliness,
operator-reported).

---

## Structure track — BACKLOG-333 (Realtime liveliness)

**Item:** BACKLOG-333 [core] — the bowl looks frozen at the 1× realtime default and
dinos never reach the grove; decouple wander + migration from the in-game clock.

**Why this cycle:** Operator-reported. Diagnosed: wander runs every 5 *in-game*
minutes and migration is capped ≤1 per *in-game day* — both fine at 60× but glacial
at the 1× default (5 real min/step; 1 migration / 24 real hr). Driving them off
real time makes the park alive at any scale.

**What ships:**
- Wander is driven by a **real-time timer** (`WANDER_STEP_MS`, ~3 s) instead of the
  `onTick` in-game-minute modulo, so `forceStep` runs at a constant watchable cadence
  regardless of clock scale. (`forceStep` body unchanged — same wander/gather/sky logic.)
- Migration drops the in-game-day cap (`lastMigrationDay`) for a **real-time cooldown**
  (`MIGRATE_COOLDOWN_MS`, ~60 s floor between migrations) via a pure
  `cooldownReady(now,last,ms)`; the 90 s roll × `MIGRATE_CHANCE` is unchanged, so
  migrations recur every few real minutes at any scale.
- Dev hooks `__wanderStepMs()` / `__migrateCooldownMs()` expose the cadences so a
  regression back to clock-gating is catchable.

**Acceptance criteria:**
- [ ] `cooldownReady(now,last,ms)` is true iff `now-last >= ms` (pure, unit-tested).
- [ ] `__wanderStepMs()` is a small real-time value (≤ 5000) — wander is not gated to in-game minutes.
- [ ] `__migrateCooldownMs()` is a real-time value (≤ a few min); migration no longer reads `lastMigrationDay`.
- [ ] `__stepWorld()` still moves dinos (forceStep body intact); existing movement/gather/sky specs green.
- [ ] `__migrate` deterministic relocate still works (cycle-068 grove-populate green).
- [ ] Build clean; full suite green.

**Out of scope:** the visible cross-zone *walk* (334 — relocate still teleports);
per-scale cadence tuning knobs; any change to the in-game clock itself.

**Constraints:** `forceStep` body unchanged (only its *driver* moves to real time).
Migration's deterministic `__migrate` path untouched. No save change. Keep the 60×
toggle (T) working.

---

## Lore track — BACKLOG-325 (Lingering lift)

**Item:** BACKLOG-325 [emergent] — for a short while after a recovery flourish (318),
a dino's idle quirk reads perkier before settling to its signature.

**Why this cycle:** 318 made recovery a one-frame flash; 325 gives it a tail — the
brightened quirk lingers as the idle glyph for a few seconds, so a just-recovered
dino visibly stays buoyant a moment.

**What ships:**
- `liftMood` (318) also stamps a per-dino lift window (`liftedUntil[name] = now + LIFT_WINDOW_MS`, ~8 s).
- In `refreshActivityMarks`, a *wandering* dino inside its lift window (and not currently
  mood-shaded) shows the brightened `reliefFlourish` glyph instead of its plain
  signature quirk; outside the window it's the normal signature.
- Dev hooks `__lifted(name)` (in-window bool) and `__liftMood(name)` (force a
  lift, for deterministic testing of both the flourish and the perk).

**Acceptance criteria:**
- [ ] `__lifted(name)` is false at boot (no recovery yet).
- [ ] After `__liftMood(name)`, `__lifted(name)` is true and the dino's activity mark shows the brightened (`✨`) glyph.
- [ ] A sulk still wins the glyph over a lift (mood shading 310 takes precedence).
- [ ] Build clean; cycle-066/070/071 fidget specs green.

**Out of scope:** smooth decay of the perk (330); a per-temperament window (327);
the greeting note (331).

**Constraints:** `moodFidget`/`reliefFlourish`/`fidget` unchanged. The perk is render
+ a transient window only — no save, no model.

---

## Cross-track collision

Both touch `WorldScene` movement code but disjoint methods: 333 → `setupMovement`
(the timer) + `maybeMigrate`/`setupMigration`; 325 → `liftMood` + `refreshActivityMarks`.
The Coder builds 333's driver rewire first, then 325's render shading. Pure helpers
are different modules (`clock.ts` `cooldownReady` vs `fidget.ts`, already shipped).
