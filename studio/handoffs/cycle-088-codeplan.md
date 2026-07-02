# Cycle 88 — Code Plan

Two file-disjoint tracks. Shared `WorldScene.ts` touched in different methods (greet path vs
resource spawn/stores) — no ordering hazard.

---

## Lore track — BACKLOG-408 Caught mid-tic

**Item:** greet a dino mid-tic → 😳 startle + bashful reply + one-time memory.

### Files to create
- none.

### Files to modify
- `game/src/world/tic.ts` — add two pure helpers:
  - `bashfulOpener(): string` — the deterministic bashful frame prefixed to a caught dino's reply (e.g. `*caught mid-fidget* Oh—! You... um. Hello.`). No args needed (a single frame reads fine); pure, testable.
  - `caughtMemory(label: string): string` — the one-time memory, weaving the ritual label (e.g. ``caught you mid-ritual — you `${label}` and the keeper saw``). Pure.
- `game/src/scenes/WorldScene.ts`:
  - New transient fields (never persisted): `private caughtTic: string | null = null;` (the dino caught this greet) and reuse the existing `ticInvented`/`resetTic`. Add a one-time guard `private ticCaughtFiled = new Set<string>();` (so the memory files once per solitary stretch).
  - `openToneMenu(target)`: at the top, if `this.ticInvented.has(target.name)` → `this.caughtTic = target.name; this.flashFeed(target, '😳')`. Else `this.caughtTic = null`. (The startle reads the instant you open the greet.)
  - `pickTone(id)`: after computing `reply`, if `this.caughtTic === target.name`: prepend `bashfulOpener()` to the shown text; if `!this.ticCaughtFiled.has(target.name)` → `this.memory = remember(this.memory, target.name, caughtMemory(signatureTic(target.traits).label))` + add to `ticCaughtFiled`. Clear `this.caughtTic = null` at the end regardless. **Change `pickTone` to `return` the shown line** (`Promise<string>`) so the e2e can read it via `__pickTone`; `onNumberKey`'s `void this.pickTone(...)` is unaffected.
  - `resetTic(name)`: also `this.ticCaughtFiled.delete(name)` and clear `caughtTic` if it names this dino — so a fresh solitary stretch can be caught (and re-remembered) again.
  - Dev hook: `(window as any).__inventTic = (name) => { set soloSteps[name]=TIC_AFTER_STEPS, ticInvented.add(name), ticAnchor[name] ??= tileOf(d) }` — forces a dino mid-tic deterministically for the e2e (no 20-step loop that a stray wanderer could perturb).

### Reuse list (MUST reuse — do not reinvent)
- `ticInvented` / `resetTic` / `signatureTic` / `TIC_AFTER_STEPS` — the 405 tic state already in WorldScene + tic.ts.
- `flashFeed(dino, glyph)` — the float-a-glyph helper (WorldScene:~1002).
- `remember` / `recall` — `ai/memory.ts` (already imported).
- `openToneMenu` / `pickTone` / `__pickTone` — the 142 greet path (WorldScene:3420/3439/1945). Do not add a new greet entry point.

### New dependencies
- none.

### Test plan
- **Unit** (`tests/unit/cycle-088-caught-tic.test.ts`): `bashfulOpener()` is a non-empty string; `caughtMemory(label)` contains the label. (Trivial but pins the frame + label weave.)
- **E2E** (`tests/e2e/cycle-088-caught-mid-tic.spec.ts`): `__inventTic('Rex')`; `const line = await __pickTone('Rex','warm')`; assert `line` starts with the bashful opener; assert `__tic('Rex').invented === true`; assert the caught memory is in `recall`/a memory hook; then greet a NON-mid-tic dino and assert its line has **no** opener (byte-identical greet).

### Risks
- The 😳 flash uses `flashFeed`, which floats over the live sprite — fine on the greet target. Ensure `caughtTic` is cleared on menu cancel (`closeToneMenu`) too, so a cancelled greet doesn't leak the bashful frame into the next dino's reply. Add the clear there.
- Keep the frame model-agnostic: we prefix `bashfulOpener()` to `reply.text` regardless of `reply.source` (stub or webllm) — never ask the model to be bashful (NPCBrain boundary intact).

### Estimated touch count
~3 files (tic.ts, WorldScene.ts, + 2 test files) — well under 6.

---

## Structure track — BACKLOG-400 Third-zone resource bias

**Item:** the Fernreach leans a third kind (frond 🌾); `ZONE_BIAS` past two.

### Files to create
- none.

### Files to modify
- `game/src/world/resource.ts`:
  - `ResourceKind` → `'branch' | 'stone' | 'frond'`.
  - `RESOURCE_GLYPH` → add `frond: '🌾'` (append after stone so stores/readouts list it last).
  - Import `FERNREACH_ID` from `./zones` (already imports `BOWL_ID`, `GROVE_ID`).
  - `ZONE_BIAS` → add `[FERNREACH_ID]: 'frond'`.
  - `pickKind`: the off-kind ternary `favored === 'branch' ? 'stone' : 'branch'` **already** yields a branch/stone off-kind for every favored value (frond → branch), so frond can never be an off-kind and stays Fernreach-exclusive; bowl/grove distributions are byte-identical. Leave the logic; add a one-line comment noting the off-kind is intentionally a primary (branch/stone) so a new favored kind never leaks elsewhere.
  - `STRUCTURE_BY_BIAS: Record<ResourceKind, Structure>` → add `frond: 'cairn'` (type-completeness forces this; frond builds a cairn by default until the frond-distinct structure 417 ships).

### Reuse list (MUST reuse)
- `RESOURCE_GLYPH` as the single kind registry — `stockpileLine`, `pickCarry`, `directedCarry`, `barterSwap`, and the WorldScene resource-draw (`RESOURCE_GLYPH[kind]`, :1138) all iterate/index it, so they pick up frond with **zero** further change.
- `pickKind`'s existing bias math + `BIAS_WEIGHT` (348).
- `zoneStoresLine(stores, active)` + `pileFor` (WorldScene:599) — the Stores plaque already maps every `ZONES` id through `stockpileLine`, so 🌾 shows automatically.
- Save path: `saveGame.ts` validates `stockpileByZone` as `zone→(string→number)` with **no kind whitelist** (:265–274) — frond banks + persists with no `SAVE_VERSION` bump.

### New dependencies
- none.

### Test plan
- **Unit** (`tests/unit/cycle-088-third-zone-bias.test.ts`):
  - `pickKind(seededRng, FERNREACH_ID)` over N draws: frond share ≈ `BIAS_WEIGHT`; the remainder are branch/stone; **frond count > 0**.
  - `pickKind(rng, BOWL_ID)` / `pickKind(rng, GROVE_ID)` / `pickKind(rng)` over N draws: **frond count === 0** (Fernreach-exclusive; bowl leans stone, grove leans branch, no-zone uniform).
  - `stockpileLine({frond:2, branch:1})` → `🪵 1 · 🌾 2` (glyph order = RESOURCE_GLYPH key order).
  - `pickCarry({frond:3}, {})` → `'frond'` (spare moves); `directedCarry({frond:3}, {}, CRAFT_RECIPE)` → falls back to `pickCarry` → `'frond'` (frond has no craft deficit, so it's a spare, not a directed pull); `directedCarry({branch:1,frond:3},{},CRAFT_RECIPE)` still prefers `branch` (recipe kind) over frond.
  - `zoneStructure(FERNREACH_ID) === 'cairn'`; `structureRecipe(FERNREACH_ID) === CRAFT_RECIPE`.
  - `barterSwap` between a frond-heavy Fernreach pile and an empty neighbour moves frond via the spare fallback.
- **E2E** (`tests/e2e/cycle-088-third-zone-bias.spec.ts`): `__setZonePile('fernreach', {frond: 2})`, cross/refresh so the keeper's active zone is the Fernreach (or read the both-zone stores line), assert the Stores plaque shows `🌾 2` for The Fernreach; sample `__biasKind('fernreach', r)` across r to show frond dominates and `__biasKind('bowl', r)` never returns frond.

### Risks
- No exhaustive `switch (kind)` on `ResourceKind` exists (grepped) — the only exhaustive record is `STRUCTURE_BY_BIAS` (handled). `PROP_RIGS` is `Record<string, PropRig>` (string-keyed), so a missing `frond` pixel rig is **not** a type error — the resource draws via its emoji glyph 🌾 (the rectangle-fallback discipline; a frond pixel prop is a future [art] item, not this cycle).
- Guard the cycle-078 bias-parity spec: the frond-exclusion assertions above are the pin that bowl/grove stay byte-identical.

### Estimated touch count
~1 source file (resource.ts) + 2 test files. No WorldScene source change strictly required
(the plaque + spawn + carry already generalize) — if a WorldScene edit turns out necessary,
it's a stores/spawn line, not the greet path, so no collision with the lore track.

---

## Cross-track collision check
Lore edits `tic.ts` + WorldScene greet path (`openToneMenu`/`pickTone`/`resetTic`/`__inventTic`).
Structure edits `resource.ts` + possibly a WorldScene stores/spawn line. No shared function; no
ordering constraint. Build + full suite must be green for the combined result before commit.

---

## Shipped (Coder)

**Files touched:**
- `game/src/world/resource.ts` (400) — `ResourceKind` += `'frond'`; `RESOURCE_GLYPH.frond='🌾'`; imported `FERNREACH_ID`; `ZONE_BIAS[FERNREACH_ID]='frond'`; `STRUCTURE_BY_BIAS.frond='cairn'`; off-kind comment. `pickKind` logic unchanged (the existing ternary already keeps the off-kind a primary, so frond stays Fernreach-exclusive and bowl/grove are byte-identical).
- `game/src/world/tic.ts` (408) — added pure `bashfulOpener()` + `caughtMemory(label)`.
- `game/src/scenes/WorldScene.ts` (408) — tic import extended (`bashfulOpener`, `caughtMemory`, `TIC_AFTER_STEPS`); fields `caughtTic` + `ticCaughtFiled`; `openToneMenu` flashes 😳 + snapshots `caughtTic` when `ticInvented`; `pickTone` prefixes `bashfulOpener()` + files the one-time `caughtMemory`, now returns the shown line (`Promise<string>`); `closeToneMenu`/`resetTic` clear the guards; `__inventTic` dev hook.
- `tests/unit/cycle-088-caught-tic.test.ts` (3), `tests/unit/cycle-088-third-zone-bias.test.ts` (8), `tests/e2e/cycle-088-caught-mid-tic.spec.ts`, `tests/e2e/cycle-088-third-zone-bias.spec.ts`.

**Deviations from plan:** none. As anticipated, no WorldScene *source* change was needed for 400 (the plaque/spawn/carry/save paths all generalize through `RESOURCE_GLYPH` + the un-whitelisted stockpile validator). The only WorldScene edits are the greet-path (408) glue.

**Build + unit:** `npm --prefix game run build` clean (type-check passed — `STRUCTURE_BY_BIAS` completeness forced the frond key). `npm run test:unit` → **928 passed** (+11). Dev server returns HTTP 200. `@mlc-ai/web-llm` boundary untouched (no import outside `game/src/ai/`). No save-version bump.
