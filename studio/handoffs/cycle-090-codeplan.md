# Cycle 90 — Codeplan

## Structure track — BACKLOG-398 Edge indicator (implement FIRST — smaller, disjoint)

**Item:** BACKLOG-398 edge indicator.

**Files to create:** none (pure helper fits `zones.ts`; labels are a small WorldScene layer).

**Files to modify:**
- `game/src/world/zones.ts` — add `edgeIndicators(zoneId: string): { edge: Edge; text: string }[]`:
  map `zoneNeighbors(zoneId)` → text `◂ ${zoneById(to).name}` for west links, `${zoneById(to).name} ▸` for east.
- `game/src/scenes/WorldScene.ts` — add `edgeLabelTexts: Phaser.GameObjects.Text[]` +
  `drawEdgeLabels()`: destroy old, one small text per indicator (west: left edge center, east: right
  edge center, vertically centered, depth ~7 with the chrome, ~10px, subtle alpha). Call from
  `create()` after floor bake and inside the zone-switch path (same site as the `drawFloor()` call
  in `__setZone` / keeper cross at ~line 569). Dev hook `__edgeLabels = () => this.edgeLabelTexts.map(t => t.text)`.

**Reuse list:** `zoneNeighbors`, `zoneById` (zones.ts); existing zone-switch re-render site;
`__setZone` e2e hook (cycle-059 spec pattern).

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-090-edge-indicators.test.ts`: pins `edgeIndicators` for bowl
  (`[{east,"The Grove ▸"}]`), grove (`[{west,"◂ Pocket Cretaceous"},{east,"The Fernreach ▸"}]`),
  fernreach (`[{west,"◂ The Grove"}]`), unknown id → [].
- E2E `tests/e2e/cycle-090-edge-labels.spec.ts`: boot → `__edgeLabels()` = `["The Grove ▸"]`;
  `__setZone('grove')` → both grove labels; `__setZone('fernreach')` → `["◂ The Grove"]`.

**Risks:** label overlap with plaque/HUD — edge-center placement avoids both (plaque is bottom
center, HUD top-left). Existing zone specs are the no-regression pin.

**Estimated touch count:** ~4 files.

## Lore track — BACKLOG-393 Brain-biased intent

**Item:** BACKLOG-393 brain-biased intent.

**Files to create:**
- `game/src/ai/intent.ts` — pure, no Phaser/WebLLM:
  - `export type IntentKind = 'social' | 'solitary' | 'forage' | 'restless'`
  - `export const INTENT_KINDS: IntentKind[]`
  - `export interface DinoIntent { kind: IntentKind; note: string; until: number /* in-game day this expires after */ }`
  - `export function proceduralIntent(name: string, day: number, traits: Personality): DinoIntent` —
    seeded via personality.ts's hash/rng pattern on `${name}#${day}`; trait-weighted pick
    (sociability leans social, low sociability leans solitary, curiosity leans forage, energy leans
    restless); deterministic note per kind ("feels like company today", "keeping to itself today",
    "has food on the brain", "itchy feet today"). `until = day`.
  - `export function fromDraft(draft: {kind: string; note: string} | null, fallback: DinoIntent): DinoIntent` —
    validate kind ∈ INTENT_KINDS, note trimmed ≤ 60 chars (fallback's note if empty); else fallback.
  - Weight nudges (all pure, all clamped):
    - `export const SOCIALIZE_BASE = 0.45`
    - `export function socializeChanceFor(intent?: DinoIntent): number` — social → 0.65, solitary → 0.25, else base; clamp [0.05, 0.95].
    - `export function ticAfterFor(intent: DinoIntent | undefined, base: number): number` — solitary → ceil(base/2) (never below ceil(base/2) floor), else base.
    - `export function forageCuriosity(curiosity: number, intent?: DinoIntent): number` — forage → min(1, curiosity + 0.25), else curiosity.
    - `export function rerollStay(intent: DinoIntent | undefined, dirIndex: number, reroll: () => number): number` — restless + dirIndex 0 → reroll once; else dirIndex.

**Files to modify:**
- `game/src/ai/personality.ts` — export the existing private `hashSeed` + `mulberry32` (rename not needed; just export) so intent.ts reuses the exact rng.
- `game/src/ai/brain.ts` — add `export interface IntentDraft { kind: string; note: string }`;
  `NPCBrain` gains optional `intend?(ctx: NPCContext): Promise<IntentDraft | null>`. StubBrain does
  NOT implement it (undefined → caller keeps procedural).
- `game/src/ai/webllmBrain.ts` — `WebLLMBrain.intend(ctx)`: short prompt ("Pick ONE word for how
  ${name} feels about today — social, solitary, forage or restless — then a short note in its
  voice…"), low tokens (~40), parse via exported `parseIntentDraft(raw: string): IntentDraft | null`
  (first kind word found in lowercased text; note = remainder/cleaned line). Any error/not-ready → null.
- `game/src/scenes/WorldScene.ts`:
  - state: `private intents: Record<string, DinoIntent> = {}`.
  - `private ensureIntent(name: string, traits: Personality): DinoIntent` — return cached if
    `until >= clock day`; else set procedural for today, and (fire-and-forget) if
    `allowAmbient({hidden, battery})` and brain has `intend`, call it; on resolve same-day, merge
    via `fromDraft` (upgrade note/kind). Never blocks a frame — mirrors `converse`.
  - decision block (~line 2233): `socializing` roll uses `socializeChanceFor`; `inventsTic` call
    passes `ticAfterFor(intent, TIC_AFTER_STEPS)`; `noticeResource` gets `forageCuriosity(...)`;
    wander else-branch pipes dirIndex through `rerollStay`.
  - dev hooks: `__intent = (n) => this.intents[n] ?? null`, `__setIntent = (n, kind) => …`
    (build a DinoIntent for today with the deterministic note).
  - `bookRows()` sets `intent: this.intents[name]?.note`.
- `game/src/world/tic.ts` — `inventsTic(soloSteps: number, after = TIC_AFTER_STEPS)`: add optional
  threshold param (default keeps every existing caller byte-identical).
- `game/src/ui/lenses.ts` — `BookRow` gains optional `intent?: string`; `bookLines` pushes
  `  today: ${r.intent}` when present.

**Reuse list:** `hashSeed`/`mulberry32` (personality.ts — the seeded-determinism pattern every
trait system uses); `allowAmbient` (governor.ts); the `converse` fire-and-forget shape
(WorldScene); `cleanReply` trimming conventions (webllmBrain.ts); BookRow optional-field pattern
(quirk, BACKLOG-303).

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/cycle-090-intent.test.ts`:
  - determinism: `proceduralIntent('Rex', 3, t)` twice → deep-equal; different day → may differ.
  - closed set: 200 (name,day) samples all yield kind ∈ INTENT_KINDS.
  - trait lean: sociability 0.95 picks `social` more often than sociability 0.05 over a day sweep.
  - weight pins: socializeChanceFor(social)=0.65 / (solitary)=0.25 / (undefined)=SOCIALIZE_BASE;
    clamps hold; ticAfterFor(solitary, 20)=10 and never < 10; forageCuriosity caps at 1;
    rerollStay only re-rolls index 0 under restless.
  - fromDraft: null → fallback; unknown kind → fallback; oversize note trimmed; valid draft kept.
  - parseIntentDraft: "solitary — wants the fern corner" → {solitary,…}; garbage → null.
- E2E `tests/e2e/cycle-090-intent.spec.ts`: boot → `__intent('Rex')` non-null, kind in closed set;
  `__setIntent('Rex','solitary')` → `__intent('Rex').kind === 'solitary'`; press V to book lens →
  `__bookText()` contains `today:`.
- Boundary: grep `@mlc-ai/web-llm` stays under `game/src/ai/` (QA step).

**Risks:**
- WorldScene decision block is dense — touch only the three roll sites + the wander else-branch;
  priority order unchanged (design constraint).
- `ensureIntent` must use the *clock* day (`getWorldClock().now().day`), not wall time, so away
  fast-forward re-authors naturally.
- The async upgrade races the day turning: guard the merge with `until === current day`.
- Unit tests import webllmBrain for `parseIntentDraft` — fine, `brain.test.ts` already imports it
  (module eval is WebGPU-free).

**Estimated touch count:** ~7 files (+2 test files). Combined with 398: ~11 — inside the v6 cap.

**Cross-track collision:** both touch `WorldScene.ts` in disjoint regions (zone-switch render site
vs step-loop decision block + hooks). Implement 398 first, commit both together after combined
build+tests (single Coder fire, per routine).
