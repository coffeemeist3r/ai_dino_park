# Cycle 65 — Design (both tracks)

## Lore track — BACKLOG-295 Dino activity readout

**Item:** BACKLOG-295 [emergent] — a small persistent per-dino glyph showing what each dino is doing *now*.

**Why this cycle:** The operator's direct note: the bowl does a lot you can't see — five dinos mill about and you can't tell the one beelining for a fallen branch from the one drifting to a friend from the one just wandering. The scene *already computes* each dino's intent every step (the `forceStep` priority ladder); this surfaces it. Legibility as distinctness — the swarm becomes five visibly-busy individuals.

**What ships:** A pure `dinoActivity(inputs) → Activity` that mirrors the existing `forceStep` precedence, and a glyph per `Activity`. Each world step, WorldScene renders a small glyph above each dino reflecting its current intent. States + glyphs (precedence high→low):
- `gazing` ✨ (a sky event is pulling it to watch)
- `inspecting` 👀 (armed first-contact, beelining the keeper)
- `responding` 🆘 (answering a distress cry)
- `feeding` 🍖 (rushing to food on the ground)
- `huddling` 💤 (heading to / in the den at huddle hour)
- `gathering` 🪵 (fetching a raw resource)
- `socializing` 💬 (drifting toward another dino)
- `wandering` 🚶 (default idle drift)

**Acceptance criteria:**
- [ ] Pure `dinoActivity(inputs)` returns the correct `Activity` for each precedence case: gazing wins over everything; inspecting/responding over food; food over huddle; huddle over gather; gather over social; social over wander. Node-tested, no Phaser.
- [ ] Each dino shows exactly one activity glyph above it, updated every world step to match what it actually does that step (e.g. during a triggered sky event every dino reads `gazing` ✨; a dino fetching a resource reads `gathering` 🪵; an otherwise-idle dino reads `wandering` 🚶).
- [ ] The readout does not visually collide with or duplicate the existing 💤 sleep marks / ❄ cold marks (position distinctly, or suppress the readout glyph for the sleeping state so 💤 isn't doubled).
- [ ] A dev hook `__activity(name)` returns the dino's current `Activity` id for the e2e.
- [ ] `@mlc-ai/web-llm` boundary untouched — the derivation is a pure function of plain flags/distances, no ai/ import.

**Out of scope:** idle fidget animations (298); the book's most-frequent-activity fingerprint (299); naming the activity in dialogue (300); persisting activity (it's live-derived, no save). Not re-deriving movement — this *reads* the same conditions `forceStep` uses, it does not change behavior.

**Constraints:** Only shared file with the structure track is `WorldScene.ts`, in disjoint regions (this track: a per-dino activity-mark render off the intent ladder; structure: the resource spawn/despawn lifecycle). Reuse the existing per-dino mark pattern (`refreshSleepMarks`/`refreshColdMarks`) for rendering — don't invent a new text-overlay system. Keep `dinoActivity` pure in its own module (e.g. `world/activity.ts` or `ui/activity.ts`).

---

## Structure track — BACKLOG-297 Legible gathering

**Item:** BACKLOG-297 [core] — make a resource appearing something the player actually catches.

**Why this cycle:** The gathering spine (146) → stockpile (285) → craft (286) arc all works, but its first link is invisible: a resource spawns at 5% per 5-in-game-minute step, one at a time, and a curious dino grabs it within a step or two — at high time-scale it's a sub-second blink. The operator never sees a resource. This makes the spawn legible without touching the system underneath.

**What ships:** Three small, additive changes:
1. **Linger grace** — a freshly spawned resource is not fetched for the first `RESOURCE_GRACE_STEPS` world steps, so it sits visibly before any dino beelines. A pure `resourceFetchable(ageSteps)` predicate; WorldScene tracks the resource's age (steps since spawn) and gates both the fetch-movement branch and the pickup on it.
2. **Spawn note** — on a natural spawn, a brief `🪵 a branch fell` / `🪨 a stone landed` line via the existing `logEvent`.
3. **Rate bump** — raise `RESOURCE_SPAWN_CHANCE` modestly (≈0.05 → ≈0.12) so resources appear often enough to notice.

**Acceptance criteria:**
- [ ] `RESOURCE_SPAWN_CHANCE` is raised (new value asserted) and `rollResource` still gates one-at-a-time (only rolled when none present).
- [ ] Pure `resourceFetchable(ageSteps)` is false below `RESOURCE_GRACE_STEPS` and true at/above it. Node-tested.
- [ ] A naturally-spawned resource is NOT picked up for the grace window — a curious dino on or beside it does not bank it until the grace passes, then does. (The `__spawnResource` dev hook spawns already-fetchable so existing gather/craft/stockpile e2e are unaffected.)
- [ ] A natural spawn emits a log note naming the kind.
- [ ] No save change; one-resource-at-a-time still holds; `world/resource.ts` stays Phaser-free.

**Out of scope:** prop *art* for the resource/cairn (296, Artist routine — still emoji this cycle); multiple resources at once; resource decay/expiry; any change to the fetch ranking vs food/huddle (146's order stays).

**Constraints:** Existing e2e (`cycle-062-resource`, `cycle-063-stockpile`, `cycle-064-craft`) spawn via `__spawnResource` and step once expecting an immediate pickup — preserve that by making `__spawnResource` mark the resource already past grace; only natural `maybeSpawnResource` starts the grace clock at 0. Shared file with the lore track is `WorldScene.ts` only, disjoint methods (`maybeSpawnResource`/`checkGather`/fetch-branch vs the activity-mark render). Keep the rate + grace constants and `resourceFetchable` in `world/resource.ts` (pure).
