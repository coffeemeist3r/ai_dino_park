# Cycle 91 — Codeplan

Build order: **structure track first** (smaller, disjoint), then lore. Shared file:
`WorldScene.ts` — structure touches `setupLenses`/`refreshLens` only; lore touches the
brain/persona call sites + save block. No same-method overlap.

## Structure track — BACKLOG-425 Zone map lens

**Item:** zone map page on the V-lens ring (chain from adjacency table + occupant counts + keeper dot).

**Files to create:**
- `tests/unit/cycle-091-zone-map.test.ts`
- `tests/e2e/cycle-091-zone-map.spec.ts`

**Files to modify:**
- `game/src/world/zones.ts` — add pure `zoneChain(): string[]`: start at the zone no `east` link targets (today the bowl), walk `neighborThrough(id, 'east')` collecting ids (cycle-guarded), append any ZONES id not reached. ~12 lines.
- `game/src/ui/lenses.ts` — `Lens` union += `'map'`; append `'map'` to `LENS_ORDER` (END of array — keeps every existing position); `LENS_LABEL.map = '🗺 Zone Map'`. Add `export interface ZoneMapEntry { id; name; count; keeper }` + pure `zoneMapModel(chain: string[], populations: Record<string, number>, keeperZone: string): ZoneMapEntry[]` (name via `zoneById` import from `../world/zones`).
- `game/src/scenes/WorldScene.ts` — in `setupLenses`: create `this.mapGfx` (graphics, depth 13, hidden) + `this.mapLabels: Phaser.GameObjects.Text[]` (one per ZONES entry, hidden); register `__zoneMap` hook returning the live model. In `refreshLens`: `mapGfx`/labels visible only when `L === 'map'`; when visible, compute `zoneMapModel(zoneChain(), zonePopulations(this.dinoZones, this.dinos.map(d => d.name), BOWL_ID), this.zoneId)` and draw a centered horizontal row of boxes (rect stroke + fill), label `${name}\n${count} 🦕`, connector line between adjacent boxes, filled dot in the keeper's box.
- `tests/e2e/cycle-021-lenses.spec.ts` — the exact-sequence assertion gains `'map'`: `['book','bonds','roles','ticker','map','off']` (feature legitimately extends the ring; note for QA).

**Reuse list:** `zoneNeighbors`/`neighborThrough`/`zoneById`/`ZONES` (zones.ts), `zonePopulations` (316), existing lens panel patterns in `setupLenses`, `__cycleLens`/`__lens` hooks, `inView`-era depth conventions (bookPanel depth 13).

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-091-zone-map.test.ts`): `zoneChain()` === `['bowl','grove','fernreach']`; contains every ZONES id exactly once; `zoneMapModel` counts mirror `zonePopulations` input; exactly one `keeper: true`, on the keeper's zone; unknown keeper zone → no keeper flag lost crash (flag simply absent nowhere true is fine — assert model length).
- E2E (`cycle-091-zone-map.spec.ts`): boot → `__cycleLens` ×5 → `__lens() === 'map'`; `__zoneMap()` has 3 entries in chain order, total count = roster size, keeper on bowl; walk/teleport keeper east (reuse cycle-073 crossing helper pattern) → `__zoneMap()` keeper on grove.

**Risks:** `cycle-021-lenses.spec.ts:17` hard-codes the ring order — MUST update in the same commit or e2e goes red. Unit `lenses.test.ts` iterates `LENS_ORDER` generically — safe.

**Estimated touch count:** ~5 files.

## Lore track — BACKLOG-103 Persona from lore

**Item:** per-dino persona — LLM-authored from park lore where a model runs, deterministic
procedural persona everywhere, generate-once/cache/persist, fed to the prompt.

**Files to create:**
- `game/src/ai/persona.ts` — pure. Exports:
  - `interface Persona { text: string; source: 'llm' | 'procedural' }`, `PERSONA_MAX = 240`.
  - `PARK_LORE` — 2–3 sentence canon blurb (pocket vivarium, the glass, the watcher roster).
  - `proceduralPersona(name, species, flavor, traits): Persona` — `mulberry32(hashSeed(name + '#persona'))` picks one entry each from small authored tables (backstory scraps, wants, fears, speech quirks), trait-conditioned phrasing (e.g. timid vs bold flavors the fear), composed with the roster `flavor` kept verbatim in the text; ≤ PERSONA_MAX by construction.
  - `fromPersonaDraft(raw: string | null, fallback: Persona): Persona` — null/empty/<20 chars → fallback; else trimmed, word-boundary capped to PERSONA_MAX, `source: 'llm'`.
  - `upgradePersona(cached: Persona, draft: string | null): Persona` — `cached.source === 'llm'` → cached (never re-author); else `fromPersonaDraft(draft, cached)`. The pure merge guard AC-6 pins.
- `tests/unit/cycle-091-persona.test.ts`
- `tests/e2e/cycle-091-persona.spec.ts`

**Files to modify:**
- `game/src/ai/brain.ts` — `NPCBrain` gains optional `author?(ctx: NPCContext): Promise<string | null>` (JSDoc mirrors `intend`; stub untouched).
- `game/src/ai/webllmBrain.ts` — export pure `buildPersonaMessages(ctx)` (system: PARK_LORE + "write 2–3 short sentences: backstory scrap, a want, a fear, a speech quirk; first person plain prose, no lists"; user: name/species/flavor + `describePersonality` adjectives). `WebLLMBrain.author(ctx)`: `_status !== 'ready'` → null (never loads); on reply `cleanReply(raw, 3) || null`; catch → `console.warn` + null.
- `game/src/world/saveGame.ts` — `SaveData.personas?: Record<string, { text: string; source: string }>` additive; deserialize passes it through like `roles`/`lastTone` (inspect the field-copy style there and match; no version bump).
- `game/src/scenes/WorldScene.ts` —
  - field `private personas: Record<string, Persona> = {}`.
  - `ensurePersona(d: Dino): Persona` (next to `ensureIntent`, same shape): cached → return; else `proceduralPersona(d.name, d.species, d.personality, d.traits)` cached now; if `this.npcBrain.author && allowAmbient(...)` fire-and-forget `author({name, species, personality: d.personality, traits: d.traits})` → `this.personas[d.name] = upgradePersona(this.personas[d.name], draft)` (guard keeps llm stable); return procedural.
  - call sites: `pickTone`'s `target.greet({...})` gains `personality: this.ensurePersona(target).text`; npc_meet `respond` ctx swaps `personality: a.personality` → `this.ensurePersona(a).text`; `ensureIntent`'s `intend` ctx same swap.
  - save: `personas: this.personas` in `currentSaveData`; restore `this.personas = (save.personas ?? {}) as Record<string, Persona>` in `setupSave`.
  - hooks: `__persona = (name) => { const d = this.dinoByName(name); return d ? this.ensurePersona(d) : this.personas[name] ?? null; }`, `__personas = () => ({...this.personas})`.

**Reuse list:** `hashSeed`/`mulberry32` (personality.ts), `cleanReply` + `describePersonality` (webllmBrain), `allowAmbient` (governor — already imported in WorldScene), `ensureIntent` shape (WorldScene:3272), additive-save conventions (roles/lastTone), `__saveNow`/reload e2e pattern (existing save specs).

**New dependencies:** none.

**Test plan:**
- Unit (`cycle-091-persona.test.ts`):
  - determinism: two `proceduralPersona('Rex', …)` calls byte-identical; ≤ PERSONA_MAX; contains flavor.
  - distinctness: 5 roster personas pairwise different.
  - `fromPersonaDraft`: null / '' / 'short' → fallback (source stays procedural); 300-char draft capped ≤ PERSONA_MAX at a word boundary; good draft → 'llm'.
  - `upgradePersona`: llm cache + new draft → unchanged; procedural + valid draft → 'llm'; procedural + null → unchanged.
  - `buildMessages({..., personality: persona.text}, greet)` system content contains persona text.
  - `buildPersonaMessages` includes PARK_LORE + the flavor.
  - save round-trip: `deserialize(serialize({...base, personas: {Rex: {…}}}))` preserves personas; absent → undefined/{} per convention.
- E2E (`cycle-091-persona.spec.ts`): boot (headless = stub/fallback path) → `__persona('Rex')` non-empty, `source: 'procedural'` (zero-model floor, AC-4); `__saveNow()`; reload; wait for restore (existing pattern); `__persona('Rex')` text byte-identical (AC-5 persist).

**Risks:** deserialize may strictly whitelist — copy the `roles` passthrough style exactly. The greet `...extra` spread already lets `personality` override (dino.ts:70–78, extra spread last) — no dino.ts change needed. `author` never fires in CI (status gate) so no new console noise (e2e zero-error specs safe; warn-not-error convention on catch).

**Estimated touch count:** ~7 files.

**Combined:** ~12 files, in budget.

## Shipped (coder)

**Files touched:**
- Structure 425: `game/src/world/zones.ts` (zoneChain), `game/src/ui/lenses.ts` (Lens 'map' appended, ZoneMapEntry, zoneMapModel), `game/src/scenes/WorldScene.ts` (mapGfx/mapLabels, refreshLens map branch, zoneMapEntries/drawZoneMap, __zoneMap), `tests/e2e/cycle-021-lenses.spec.ts` (ring gains 'map'), `tests/unit/cycle-091-zone-map.test.ts`, `tests/e2e/cycle-091-zone-map.spec.ts`.
- Lore 103: `game/src/ai/persona.ts` (new), `game/src/ai/brain.ts` (optional author), `game/src/ai/webllmBrain.ts` (buildPersonaMessages + WebLLMBrain.author, status-gated), `game/src/world/saveGame.ts` (personas additive), `game/src/scenes/WorldScene.ts` (personas field, ensurePersona, fed into pickTone greet / npc_meet respond / intend ctx, save+restore, __persona/__personas), `tests/unit/cycle-091-persona.test.ts`, `tests/e2e/cycle-091-persona.spec.ts`.

**Deviations:**
- `personas` deserializes to **undefined when absent** (stockpileByZone precedent) instead of `{}` — the plan's `{}` default broke 15 full-object `toEqual` round-trip tests in saveGame.test.ts; WorldScene still defaults `save.personas ?? {}`. Plan's own risk note, resolved the additive way.
- Planned persona e2e #3 (greet-path observation) replaced with a generate-once cache-stability test — `__greet` records friendship only and never runs the dialog path, so the greet-side wiring is pinned by the buildMessages unit test instead.

**Status:** build clean; 980 unit green (+17: 11 persona + 6 zone-map); dev server HTTP 200. web-llm boundary intact (author lives in webllmBrain only). E2E left to QA.
