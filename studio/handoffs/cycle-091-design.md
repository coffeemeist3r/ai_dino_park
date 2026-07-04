# Cycle 91 — Design

## Lore track — BACKLOG-103 Per-dino persona authored from lore

**Item:** BACKLOG-103 [ai] — replace the shared one-line roster `personality` string with a real
per-dino persona: backstory, wants, fears, speech quirk. LLM-authored from park lore where the
device allows; deterministic procedural persona everywhere else. Generate once, cache, persist
in the save, feed into the prompt.

**Why this cycle:** Milestone 1 arc 2 ("A self to lean with"). Cycle 90 gave every dino an
intent; the intent leans on a persona that is still `'curious, friendly, loves rocks'` shared
verbatim with every prompt. This is the CHARTER "Living minds" core goal, seeded 2026-06-01 and
finally arc-sized enough to ship whole under v6.

**What ships:**

- New pure `game/src/ai/persona.ts` (no Phaser, no WebLLM):
  - `interface Persona { text: string; source: 'llm' | 'procedural' }`, `PERSONA_MAX = 240`.
  - `PARK_LORE` — a 2–3 sentence canon blurb (the pocket vivarium, the glass, the watcher) used
    by the authoring prompt so the persona is "authored from world lore", not from thin air.
  - `proceduralPersona(name, species, flavor, traits): Persona` — the deterministic floor.
    Seeded from the name (reuse `hashSeed`/`mulberry32`), it picks a backstory scrap, a want, a
    fear, and a speech quirk from small authored tables, phrased by traits, and keeps the roster
    `flavor` in the text. Same inputs → byte-identical text, every call, every device.
  - `fromPersonaDraft(raw: string | null, fallback: Persona): Persona` — untrusted-model
    validation: null / empty / < 20 chars → fallback unchanged; otherwise trimmed, capped at
    `PERSONA_MAX` on a word boundary, `source: 'llm'`.
- `NPCBrain` gains **optional** `author?(ctx): Promise<string | null>` (exactly the `intend`
  pattern). The stub omits it. `WebLLMBrain.author` asks for 2–3 short sentences of persona
  (backstory / want / fear / speech quirk) built from `PARK_LORE` + name/species/flavor/trait
  adjectives, runs the reply through `cleanReply(raw, 3)`, returns null on any failure, and
  **never triggers a model load** (a persona is ambience, not worth a download).
- WorldScene:
  - `personas: Record<string, Persona>` field; `ensurePersona(d): Persona` mirrors
    `ensureIntent`: cached → returned as-is (**an 'llm' persona is never re-authored** —
    generate once, reuse forever); missing → procedural persona cached immediately +
    fire-and-forget `author` upgrade (governor `allowAmbient`-gated) that replaces the cache
    only while it is still `source: 'procedural'`.
  - The persona text is fed as `personality` into all three brain call sites: the player-greet
    (`target.greet({ personality: ensurePersona(target).text, … })`), the npc_meet `respond`
    ctx, and the `intend` ctx — `buildMessages` then carries it with zero change of its own.
  - Persistence: `personas` rides the save (`currentSaveData` + restore in `setupSave`),
    additive optional field — old saves load with `{}` and regenerate deterministically.
  - Dev hooks: `__persona(name)`, `__personas()`.
- `world/saveGame.ts`: `personas?: Record<string, { text: string; source: string }>` on
  `SaveData`, additive (no version bump; absent → `{}`).

**Acceptance criteria:**
- [ ] `proceduralPersona` is deterministic: two calls with the same (name, species, flavor, traits) return byte-identical text; text is non-empty, ≤ PERSONA_MAX, and contains the roster flavor string.
- [ ] The five roster dinos' procedural personas are pairwise distinct.
- [ ] `fromPersonaDraft`: null, empty, and < 20-char drafts return the fallback unchanged (still 'procedural'); a valid draft returns `source: 'llm'` capped ≤ PERSONA_MAX.
- [ ] With the stub brain (no `author`), `ensurePersona` yields the procedural persona and greeting works — full sim with zero model (e2e runs headless, no WebGPU).
- [ ] Generate-once + persist: after first greet, `__exportSave()` contains `personas` with that dino's entry; reload restores it byte-identical (e2e save→reload).
- [ ] An `'llm'`-sourced cached persona is never re-authored; a `'procedural'` cache upgrades at most once per author success (unit on the merge guard, pure).
- [ ] The greet prompt carries the persona: `buildMessages` with `personality = persona.text` puts that text in the system message (unit).
- [ ] `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep).
- [ ] Full suite green: build, unit, e2e.

**Out of scope:** keeper personas (156), persona line in the collection book, tone/memory
feeding back into the persona, persona drift (043), re-authoring ever, Qwen thinking mode.

**Constraints:** all inference behind `NPCBrain`; `persona.ts` stays pure/Node-testable; the
save change is additive-optional (old saves load unchanged); the roster `personality` field
stays (it seeds the procedural persona and remains the fallback for anything not yet ensured).

## Structure track — BACKLOG-425 Zone map lens

**Item:** BACKLOG-425 [core] — a map page on the V-lens ring: the whole zone chain drawn from
the adjacency table, each zone a labelled box with its live occupant count and a dot for the
keeper.

**Why this cycle:** Milestone 1 structure arc 2 ("The world at a glance"). Cycle 90 made each
edge name its neighbour; the chain is now legible one edge at a time but never as a whole. The
adjacency table (383) and per-zone head counts (316) already exist — this is a pure readout, the
lens philosophy exactly.

**What ships:**

- `world/zones.ts`: pure `zoneChain(): string[]` — the zones ordered west→east by walking the
  adjacency table's east links from the zone no east link points to (today: bowl → grove →
  fernreach); any zone not reached is appended so a future orphan still shows. A fourth zone
  joins the map by adding its ZONE_LINKS row, zero UI edits.
- `ui/lenses.ts`: `Lens` gains `'map'`, **appended at the end** of `LENS_ORDER` (off → book →
  bonds → roles → ticker → map) so every existing lens position is untouched; label
  `'🗺 Zone Map'`. Pure `zoneMapModel(chain, populations, keeperZone)` returning
  `Array<{ id, name, count, keeper }>` — the single source the scene draws and the hook returns.
- WorldScene (`setupLenses`/`refreshLens`): a `map` branch drawing the model as a horizontal
  row of labelled boxes (zone name + `n 🦕`), a connecting line between adjacent boxes, and a
  keeper dot inside the current zone's box. Redrawn every `refreshLens` tick (counts and keeper
  position stay live). Chrome-depth like the book panel; hidden except in the map lens.
- Dev hook: `__zoneMap()` → the current model.

**Acceptance criteria:**
- [ ] `zoneChain()` returns `['bowl', 'grove', 'fernreach']` from the live table and includes every ZONES id exactly once (unit).
- [ ] `zoneMapModel` counts equal `zonePopulations` for the same inputs, and exactly one entry has `keeper: true` — the keeper's zone (unit).
- [ ] Cycling V reaches the map lens after ticker and returns to off after it; `__lens()` reports `'map'` (e2e).
- [ ] In the map lens, `__zoneMap()` shows 3 zones in chain order with the full roster counted in their home zones (e2e).
- [ ] After the keeper crosses east, `__zoneMap()`'s keeper flag moves to the grove (e2e, reuse the existing crossing helpers).
- [ ] Existing lens specs stay green (order-append keeps book/bonds/roles/ticker positions).

**Out of scope:** an always-on minimap, zone thumbnails/terrain previews in the boxes, click/tap
navigation from the map, non-linear (grid) layouts.

**Constraints:** pure logic in zones.ts/lenses.ts (Node-testable); drawing only in WorldScene.
**Cross-track overlap:** both tracks touch WorldScene.ts in disjoint regions (setupLenses/
refreshLens vs the brain/persona + save blocks) — build the structure track (smaller) first,
lore second, standing precedent.
