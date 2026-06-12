# Cycle 46 — Code Plan

**Item** — BACKLOG-194 [emergent] Distress call — a shivering (179) or startled (057) dino calls out in its own voice, and its closest friend (013) turns toward the sound from across the bowl.

## Files to create

### `game/src/world/distress.ts` (pure — no Phaser, no WebAudio)
- `export const DISTRESS_STEPS = 6` — responder walk budget in world steps (bowl is 20×15; 6 steps is a visible turn-and-approach without committing to a full crossing).
- `export function mostDistressed(cands: Array<{ name: string; level: number }>): string | null` — lowest `level` wins, lexicographic-smallest name on ties (the `topBy`/`comforter` tie-break convention), empty → `null`. One generic picker for both triggers: startle uses `level = bravery` (most frightened), cold uses `level = maxBond` (loneliest).
- `export function hearLine(caller: string): string` → `` `👂 ${caller}?!` `` — the responder's bubble.
- `export function heardMemory(caller: string): string` → `` `heard ${caller} cry out and went to it` `` — the responder's persisted memory.
- **Responder selection is NOT reimplemented here** — WorldScene calls the existing `comforter()` (world/comfort.ts) directly.

### `tests/unit/distress.test.ts`
### `tests/e2e/cycle-046-distress.spec.ts`

## Files to modify

### `game/src/audio/chirp.ts`
- Add `export function distressParams(t: Personality): ChirpParams` — derive from `chirpParams(t)`: `pitchHz = min(1100, round(pitch × 1.35))`, `lengthMs = max(60, round(length × 0.55))`, `wobble = min(1, wobble + 0.3)`, `notes = 2` (a two-pip yelp). Same voice, distress register: strictly higher + strictly shorter than the base call for every legal trait vector (base pitch caps at 900 < 1100·cap and base length floors at 80 > 60·floor, so strictness holds everywhere); monotone in base pitch below the cap so the founders keep their order (Twitch 797→1076 stays under the cap).

### `game/src/scenes/WorldScene.ts` (thin glue only)
- New fields: `lastDistress: { name: string; trigger: 'startle' | 'cold'; params: ChirpParams } | null = null`; `pendingRespond: { name: string; caller: string; steps: number } | null = null`.
- New private `cryDistress(d: Dino, trigger: 'startle' | 'cold')`:
  1. `const params = distressParams(d.traits)`; set `lastDistress` (the diegetic record — fires regardless of mute).
  2. If `!soundMuted()`: set `lastSound = { kind: 'chirp', name, params }` + `playChirp(params)` (mute gates playback intent only, matching `chirpFor`).
  3. `const who = comforter(d.name, this.bonds, this.dinos.map((x) => x.name), this.gratitude)`; if non-null: `pendingRespond = { name: who, caller: d.name, steps: DISTRESS_STEPS }`, `showBubble(friend, hearLine(d.name))`, `this.memory = remember(this.memory, who, heardMemory(d.name))`. Null → the cry hangs unanswered.
- `tapGlass()`: while looping reactions, collect bolters as `{ name, level: d.traits.bravery }`; after the loop, `const crier = mostDistressed(bolters)`; if found → `cryDistress(dino, 'startle')`. One tap, one cry.
- `resolveColdMorning()`: collect cold sleepers as `{ name, level: this.maxBond(name) }` (the loop already computes both); after the loop, `mostDistressed(...)` → `cryDistress(d, 'cold')`. Warm seasons produce an empty cold list, so the guard is free.
- `forceStep()` per-dino loop: insert the responder override **after** the `pendingInspect` block and **before** the food block (sky gather already returns early above everything):
  ```
  if (this.pendingRespond?.name === d.name) {
    const caller = this.dinoByName(this.pendingRespond.caller);
    if (caller) { step = stepToward(cur, this.tileOf(caller), COLS, ROWS); setPosition; continue; }
  }
  ```
  Re-read the caller's tile live each step (tap-glass jumps the caller two tiles the same instant it cries).
- New private `stepResponder()` called beside `stepInspection()` (after the movement loop): adjacency to the caller (`TILE * 1.01` box, the inspection convention) → clear `pendingRespond`; else decrement `steps`, ≤ 0 → clear.
- Hooks (in the existing dev-hook block): `__lastDistress` → `lastDistress` copy; `__distressResponder` → `pendingRespond` copy or null; `__cryDistress(name)` → stages the beat directly for deterministic e2e (the `__triggerSky`/`__dropFood` staging convention).
- Latest cry wins: a second cry simply overwrites `pendingRespond` (no queue — matches the one-shot inspection model).

## Reuse list (MUST use, not reinvent)

- `comforter(sulker, bonds, names, gratitude)` — `game/src/world/comfort.ts` — THE responder pick: gratitude-debt override, `COMFORT_BOND_FLOOR`, alpha tie-break, all for free. Design constraint: no fork.
- `chirpParams` + `ChirpParams` — `game/src/audio/chirp.ts` — the distress register derives from the base voice.
- `playChirp` / `soundMuted` — `game/src/audio/voice.ts` — already imported in WorldScene; **no voice.ts change** (params-only register).
- `stepToward` — `game/src/world/movement.ts`; `remember` — `game/src/ai/memory.ts`; `this.maxBond` / `this.tileOf` / `this.dinoByName` / `this.showBubble` — existing WorldScene helpers.
- `mostDistressed` tie-break mirrors `homecoming.ts` `topBy` convention (lexicographic-smallest).
- E2E staging: `boot` helper + `__bondPair` / `__setClock` / `__stepWorld` / `__tapGlass` / `__memory` hooks; cycle-043's `stageNight`/`intoMorning` pattern for the cold trigger.

## New dependencies

None. WebAudio is built-in and already wrapped; everything else is arithmetic.

## Test plan

### Unit — `tests/unit/distress.test.ts` (~7)
1. `mostDistressed` picks the lowest level.
2. Equal levels break to the lexicographic-smallest name.
3. Empty list → null.
4. `hearLine`/`heardMemory` contain the caller's name (+ 👂 in the line).
5. `distressParams` vs `chirpParams` for all five founders: pitch strictly higher and ≤ 1100; length strictly shorter and ≥ 60; notes === 2; wobble ≤ 1.
6. Founder pitch ORDER preserved in distress (sorted-by-pitch sequence identical; Twitch's yelp above Mossback's).
7. `DISTRESS_STEPS` ≥ 4 (the design's minimum step budget).

(Founder traits come from `seedPersonality` on roster names — the chirp.test.ts pattern.)

### E2E — `tests/e2e/cycle-046-distress.spec.ts` (~5)
1. **One tap, one cry** — boot; `__tapGlass` at a spot with bolters (the cycle-023 staging); assert `__lastDistress` is `{ trigger: 'startle' }`, its `name` is among the returned `bolt` reactions, and only one cry fired.
2. **The friend turns** — boot; `__bondPair('Twitch','Glade', 12)` (over the floor); `__cryDistress('Twitch')`; assert `__distressResponder` = Glade→Twitch; `__memory` for Glade contains `heard Twitch cry out`; then `__stepWorld` ×6 → responder's tile distance to Twitch decreased and `__distressResponder` eventually null (arrival or budget).
3. **Unanswered** — fresh boot (all bonds 0 < floor 8); `__cryDistress('Twitch')` → `__lastDistress` set, `__distressResponder` null.
4. **The cold finds a voice** — cycle-043 staging exactly (winter night day 22, Rex↔Mossback bonded 12, cross into morning): `__coldSleepers` non-empty, `__lastDistress` = `{ trigger: 'cold', name: 'Glade' }` (the loners tie at maxBond 0 → alpha-smallest of the cold list, deterministic). Then the warm variant (summer day 10): no cry.
5. **Mute never gates the bowl** — boot; press `M` (mute); `__bondPair` + `__cryDistress` → `__distressResponder` fires and the memory lands, but `__lastSound` records no chirp for the caller.

### Full suite
`npm run test:unit`, `npm --prefix game run build`, `npx --yes kill-port 5173 && npx playwright test` — cycle-023 (tap reactions), cycle-043 (cold), cycle-033/034 (comfort floor/gratitude), cycle-044/045 (sound/chorus) are the regression sentries.

## Risks

- **tapGlass mutates positions mid-beat** — the caller jumps two tiles as it bolts; the responder override must aim at the caller's live tile each step (planned: re-read via `tileOf`), not a snapshot.
- **Cry during sky-event/inspection** — sky gather returns early before the responder override (the spectacle outranks the cry), and `pendingInspect` is checked first for the same dino; both are design-sanctioned priorities. A responder dragged to a sky gather just resumes after (steps keep draining only in `stepResponder`, which still runs — acceptable: the budget may expire mid-spectacle; note for QA, not a defect).
  - Correction during implementation check: `stepSky()` returning true exits `forceStep` before `stepResponder` would run if `stepResponder` is called inside `forceStep` after the loop — place `stepResponder()` beside `stepInspection()` (which sits after the movement loop and is likewise skipped during a sky event), matching inspection's freeze-during-spectacle behavior exactly.
- **The responder may itself have bolted** — fine; it turns from wherever it landed.
- **Hour-7 chorus + hour-8 cold morning** — distinct seams (`onHour` vs window-edge in step); the cycle-043 staging crosses straight to hour 8 with restore semantics, so no chorus interference in e2e.
- **`mutedCache` persistence in e2e 5** — the M key path uses `setSoundMuted`, session-cached; no reload between mute and assert, so no storage-order surprises.

## Estimated touch count

~5 files (1 new module + 2 modified + 2 test files). Within budget.

## Shipped

**Files touched (5, exactly as planned):**
- `game/src/world/distress.ts` (new) — DISTRESS_STEPS=6, mostDistressed, hearLine, heardMemory
- `game/src/audio/chirp.ts` — +distressParams (params-only distress register)
- `game/src/scenes/WorldScene.ts` — cryDistress, bolter pick in tapGlass, lonely pick in resolveColdMorning, responder override in forceStep (after inspect, before food, live caller tile), stepResponder beside stepInspection, hooks __lastDistress/__distressResponder/__cryDistress
- `tests/unit/distress.test.ts` (new) — 8 tests
- `tests/e2e/cycle-046-distress.spec.ts` (new) — 6 tests

**Deviations:** none of substance. Two counts ran over plan, both upward: 8 unit tests (plan ~7 — the corner-clamp check became its own test) and 6 e2e (plan ~5 — the no-bolt tap got its own spec instead of riding the first). The no-cry tap test picks the corner farthest from the live cast rather than a fixed corner, to stay deterministic against spawn spread.

**Build:** clean (tsc + vite + PWA). **Unit:** 395/395 green (+8). **Dev render:** HTTP 200.
E2E left to QA per the chain (the 6 new specs are written and type-check; full Playwright run is QA's fire).
