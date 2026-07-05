# Cycle 92 — Design

Two near-disjoint tracks that together close **Milestone 1**. Lore = the day's lean gets an
arc across the day (a persona-shaped daily plan). Structure = the save-migration rail is rooted
at v0 so versionless saves load. File overlap: **none** — 012 stays out of the save path by
design (recomputed, not persisted); 426 touches only `saveGame.ts` + its test. Coder may build
in either order.

---

## Lore track — BACKLOG-012 (NPC daily plan)

**Item:** BACKLOG-012 [ai] NPC daily plan — a persona-shaped schedule of intents across the
in-game day, consulted by the world tick. Milestone 1 lore arc 3 ("The day has a shape").

**Why this cycle:** BACKLOG-393 (cycle 90) gave each dino one intent for the *whole* day — a
flat lean (`social`/`solitary`/`forage`/`restless`) that scales the step-loop rolls. It's the
BACKLOG-104 action spine already. What's missing is a *shape*: the lean never changes between
dawn and dusk, so "the day" has no arc. 012 makes the lean a **day-plan** — one intent per
day-phase (`dawn`/`day`/`dusk`/`night`, the existing `dayPhase(hour)`) — so a dino that forages
at dawn drifts to company by midday and keeps to itself at night, all shaped by its traits.
The world tick already consumes a `DinoIntent`; it now gets the *current phase's* one. This is
"minds act, not just reply" made continuous across the day. Closes Milestone 1's last lore arc.

**What ships:**
- A pure `game/src/ai/plan.ts`: `proceduralPlan(name, day, traits) → DayPlan` (a `DinoIntent`
  kind per `DayPhase`), deterministic and trait-weighted per phase (reusing intent.ts's weight
  pick), plus `activeIntent(plan, phase, day) → DinoIntent` and a `planShape(plan) → string`
  one-liner for the book.
- In-world: as the in-game clock crosses a day-phase boundary, each dino's active intent (the
  one nudging its socialize / tic / forage / wander rolls) **switches** to that phase's plan
  entry — visibly changing behaviour across the day, deterministically, with **zero** model.
- The collection book's dino block gains a `plans:` shape line (e.g. `plans: forage → social →
  solitary → rest`) beside the existing `today:` active-intent note.
- LLM enrichment preserved: where a brain can author (`intend` present, governor allows), it
  still colors the *active* phase intent's note exactly as today — floor unchanged when the
  brain is stub/declined/headless.
- `window.__plan(name)` dev hook returns the dino's `DayPlan` for tests.

**Acceptance criteria:**
- [ ] `proceduralPlan(name, day, traits)` is deterministic: same args → deep-equal `DayPlan`; a different day or name changes it.
- [ ] A `DayPlan` has exactly one intent kind for each of the four `DayPhase` values, each kind in `INTENT_KINDS`.
- [ ] Traits lean the per-phase pick in character (a max-sociability dino's plan contains more `social` phases than a min-sociability one over a sample of days) — pinned by a statistical unit assert.
- [ ] `activeIntent(plan, phase, day)` returns a `DinoIntent` whose `kind === plan[phase]`, `note === INTENT_NOTES[kind]` (absent LLM color), and `until === day`.
- [ ] In-game, forcing the clock across a day-phase boundary changes at least one dino's active intent kind (via `__intent(name)`) to match `__plan(name)[newPhase]` — e2e with a clock/phase hook.
- [ ] The book shows a `plans:` line whose four segments read left→right dawn,day,dusk,night for a dino — asserted via `__bookText()`.
- [ ] Deterministic floor proven headless: with the stub brain (no WebGPU), every dino has a full plan and the active intent tracks the phase, zero console errors.
- [ ] `npm run build` clean; `@mlc-ai/web-llm` still imported only under `game/src/ai/`; **no save-format change** (grep: no new `SaveData` field, no `SAVE_VERSION` bump from this track).

**Out of scope:** persisting the plan (it's recomputed from name+day+traits — no save field);
per-phase LLM authoring (the brain still colors only the active note, as 393 does); reflection
/ dusk summary (BACKLOG-014); a plan the *player* can edit.

**Constraints:** Do not touch the save path (that's the structure track's file, and 012 must
stay disjoint). The plan must never *reorder* the existing decision priority — it only swaps
which `DinoIntent` feeds the already-clamped nudges (`socializeChanceFor`/`ticAfterFor`/
`forageCuriosity`/`rerollStay`). Keep `ensureIntent`'s existing signature/consumers working —
callers still get a `DinoIntent`; only its source changes (plan-derived, phase-aware).

---

## Structure track — BACKLOG-426 (root the save-migration rail at v0)

**Item:** BACKLOG-426 [infra] Versioned save envelope — root the ordered migration rail at v0
so versionless saves load unchanged through a v0→v1 no-op. Milestone 1 structure arc 3 (final).

**Why this cycle:** The migration rail already exists (BACKLOG-040: `SAVE_VERSION = 2`, a
`MIGRATIONS` table keyed by from-version, a `migrate()` chain, a worked v1→v2 step). But
`migrate()` **rejects** a missing/`< 1` version (`return null`), so the oldest *versionless*
save — the exact case 426's text calls out ("old versionless saves load unchanged through a
v0→v1 no-op migration that proves the rail") — is discarded and silently becomes a new game, a
data-loss trap. This roots the chain at its true origin: a missing `version` is read as `0` and
lifted v0→v1 (no-op stamp), so every save ever written rides the migration chain. Small, but
it's the one unshipped slice of the arc and it hardens the persistence spine Milestone 1 stands on.

**What ships:**
- `migrate(raw)`: an absent/`undefined` `version` is treated as `0` (not rejected). `v === 0`
  is accepted; the chain runs `MIGRATIONS[0]` (v0→v1, a no-op that stamps `version: 1`) then the
  existing `MIGRATIONS[1]` (v1→v2). A non-integer, negative, or `> SAVE_VERSION` version is
  **still rejected** (`null`), as is a gap in the chain.
- Net effect: a versionless save (with any subset of today's additive fields) deserializes to a
  valid `SaveData` at `SAVE_VERSION` instead of returning `null`.

**Acceptance criteria:**
- [ ] `migrate({...no version...})` returns a non-null object with `version === SAVE_VERSION`.
- [ ] `migrate({version: 0, ...})` returns a non-null object with `version === SAVE_VERSION` (explicit v0 handled identically).
- [ ] `deserialize(serialize(save-without-version))` round-trips to a valid `SaveData` (was `null` before) — a versionless payload carrying a modern additive field (e.g. `personas`) survives the full v0→v2 chain with that field intact.
- [ ] `migrate({version: SAVE_VERSION + 1})` still returns `null` (newer rejected); `migrate({version: 1.5})` still `null` (non-integer); `migrate({version: -1})` still `null`.
- [ ] The v0→v1 step is a pure no-op on payload shape: for a versionless object, the only field the step adds/changes is `version` (all other keys byte-identical) — pinned by a unit assert.
- [ ] `npm run build` clean; existing save tests (`saveGame.test.ts`, `cycle-061-save-version.test.ts`) still green; no change to `SaveData` fields or `SAVE_VERSION`.

**Out of scope:** bumping `SAVE_VERSION` (no real format change this cycle — a fake bump would
be a migration for a value that never changed); rewriting the per-field additive validation in
`deserialize`; any IndexedDB/`saveStore.ts` change.

**Constraints:** Keep `migrate` pure (never mutate `raw`). Do not weaken the rejection of
newer/non-integer versions. Touch only `saveGame.ts` + its test file — disjoint from the lore
track.
