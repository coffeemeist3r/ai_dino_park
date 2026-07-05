# Cycle 92 — Code Plan

Two file-disjoint tracks. No cross-track collision (lore = `ai/plan.ts` + `ai/intent.ts` +
`WorldScene` + `lenses.ts`; structure = `saveGame.ts` only). Build either order.

---

## Lore track — BACKLOG-012 (NPC daily plan)

**Item:** persona-shaped day-phase intent schedule the world tick consults.

### Files to create
- `game/src/ai/plan.ts` — pure, Node-testable (no Phaser/WebLLM):
  - `export type DayPlan = Record<DayPhase, IntentKind>` (import `DayPhase` from `../world/dayNight`, `IntentKind` from `./intent`).
  - `export function proceduralPlan(name: string, day: number, traits: Personality): DayPlan` — for each of the four `DayPhase`s, seed `mulberry32(hashSeed(\`${name}#plan#${day}#${phase}\`))` and call the reused `pickKind(rand, traits)`. Deterministic; distinct seed per phase so phases differ in character.
  - `export function activeIntent(plan: DayPlan, phase: DayPhase, day: number): DinoIntent` → `{ kind: plan[phase], note: INTENT_NOTES[plan[phase]], until: day }`.
  - `export function planShape(plan: DayPlan): string` → the four phases in fixed dawn→day→dusk→night order mapped to a short glyph/word per kind, joined ` → ` (e.g. `forage → social → solitary → rest`). Provide `const SHAPE_WORD: Record<IntentKind,string>` (`social`→`social`, `solitary`→`solitary`, `forage`→`forage`, `restless`→`rest`).
  - `export const DAY_PHASES: readonly DayPhase[] = ['dawn','day','dusk','night']` (fixed render/iteration order).

### Files to modify
- `game/src/ai/intent.ts` — extract the weighted kind pick from `proceduralIntent` into `export function pickKind(rand: () => number, traits: Personality): IntentKind` (the exact weight table currently inline). Rewrite `proceduralIntent` to call it (behaviour byte-identical — same seed, same table, so existing cycle-090 pins hold). No other change.
- `game/src/scenes/WorldScene.ts`:
  - Import `proceduralPlan, activeIntent, planShape, type DayPlan` from `../ai/plan`; import `dayPhase` from `../world/dayNight`.
  - Add field `private plans: Record<string, { day: number; plan: DayPlan }> = {}` and `private intentPhase: Record<string, DayPhase> = {}`.
  - Add `private ensurePlan(d: Dino, day: number): DayPlan` — cache per (name, day); recompute `proceduralPlan` when the cached day differs.
  - Rework `ensureIntent(d)`: read `day`+`hour` from `getWorldClock().now()`, `phase = dayPhase(hour)`, `plan = ensurePlan(d, day)`. If `this.intents[d.name]` exists AND `intentPhase[name] === phase` AND `intents[name].until === day` → return cached (LLM color preserved for this phase). Else set `this.intents[name] = activeIntent(plan, phase, day)`, `this.intentPhase[name] = phase`, and fire the **existing** governor-gated `intend()` upgrade (unchanged: merges via `fromDraft` only if `intents[name]?.until === day`). Return the active intent. (The `intend()` call keeps passing `ensurePersona(d).text`.)
  - `__intent` hook: unchanged behaviour (still returns `ensureIntent(d)`), now phase-aware for free.
  - Add `(window as any).__plan = (name) => { const d = this.dinos.find(x=>x.name===name); return d ? this.ensurePlan(d, getWorldClock().now().day) : (this.plans[name]?.plan ?? null); }` next to `__intent`.
  - `bookRows()`: add `plans: planShape(this.ensurePlan(d, getWorldClock().now().day))` to each row (keep the existing `intent:` line as the active note).
- `game/src/ui/lenses.ts` — `BookRow`: add `plans?: string`. In `bookLines`, after the `today:` line, `if (r.plans) out.push(\`  plans: ${r.plans}\`);`.

### Reuse list (MUST reuse — no reinvention)
- `game/src/ai/intent.ts` — `IntentKind`, `INTENT_KINDS`, `INTENT_NOTES`, `DinoIntent`, `fromDraft`, and the new extracted `pickKind` (the weight table lives once).
- `game/src/world/dayNight.ts` — `dayPhase(hour)`, `DayPhase` (do NOT invent a new day-part enum).
- `game/src/ai/personality.ts` — `hashSeed`, `mulberry32`, `Personality`.
- `game/src/world/clock.ts` — `getWorldClock().now()` for day+hour.
- Existing `ensureIntent` consumers (`socializeChanceFor`/`ticAfterFor`/`forageCuriosity`/`rerollStay` at the step loop) stay untouched — they still receive a `DinoIntent`.

### New dependencies
none.

### Test plan
- Unit `tests/unit/cycle-092-plan.test.ts`:
  - `proceduralPlan` deterministic (deep-equal on repeat); different day/name ⇒ different plan.
  - every plan has all four `DayPhase` keys, each value in `INTENT_KINDS`.
  - trait lean: over N=200 days, a max-sociability dino's plans contain strictly more `social` phase-slots than a min-sociability dino's (statistical).
  - `activeIntent(plan, phase, day)` → `{kind: plan[phase], note: INTENT_NOTES[...], until: day}`.
  - `planShape` returns four ` → `-joined segments in dawn→day→dusk→night order.
  - `pickKind` reuse: `proceduralIntent('Rex',3,t)` still deep-equals the pre-refactor value (guard the byte-identical refactor — copy the existing cycle-090 determinism expectation).
- E2E `tests/e2e/cycle-092-plan.spec.ts`: boot; read `__plan('Rex')` (four phases); force the clock across a phase boundary (reuse whatever clock hook the cycle-090 intent e2e used — `__setClock`/`__advanceClock` or the intent spec's phase approach) and assert `__intent('Rex').kind === __plan('Rex')[newPhase]`; assert `__bookText()` contains a `plans:` line; assert zero console errors (stub-brain floor).

### Risks
- The `intend()` LLM color now resets when the phase turns (the active note re-derives deterministically per phase). That's acceptable and intended (floor-first); note it so QA doesn't read it as a regression.
- `ensureIntent` is called hot in the step loop — `ensurePlan` must be O(1) cached, not recompute per call. Cache keyed on day.
- Don't let `planShape` order drift from `DAY_PHASES`; both must be dawn→day→dusk→night.

### Estimated touch count
~6 files (1 new module, 1 new unit, 1 new e2e, intent.ts, WorldScene.ts, lenses.ts).

---

## Structure track — BACKLOG-426 (root the save-migration rail at v0)

**Item:** versionless saves load through a v0→v1 no-op instead of being rejected.

### Files to create
none.

### Files to modify
- `game/src/world/saveGame.ts`:
  - `MIGRATIONS`: add `0: (o) => ({ ...o, version: 1 })` (v0→v1 no-op stamp; every field is additive-optional so a versionless payload is already shape-compatible — the worked v0 example).
  - `migrate(raw)`: coerce a missing version to 0 — `const v = raw.version === undefined ? 0 : raw.version;` then keep `if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > SAVE_VERSION) return null;` (lower floor from `< 1` to `< 0`; a present-but-non-number/non-integer/negative/newer version still rejected). The existing `for (let from = v; from < SAVE_VERSION; from++)` chain then runs `MIGRATIONS[0]`→`MIGRATIONS[1]` for a v0 save. Keep the gap guard (`if (!step) return null`) and the no-mutation contract. Update the doc-comment to say the rail is rooted at v0.

### Reuse list
- The existing `MIGRATIONS`/`migrate` rail (BACKLOG-040) — extend it; do NOT add a parallel path. `deserialize` already calls `migrate` then validates — unchanged.

### New dependencies
none.

### Test plan
- Unit — extend `tests/unit/cycle-061-save-version.test.ts` (the migration-rail spec) or add `tests/unit/cycle-092-save-v0.test.ts`:
  - `migrate({...valid save fields, no version})` → non-null, `version === SAVE_VERSION`.
  - `migrate({version: 0, ...})` → same.
  - `deserialize(JSON.stringify({...a full valid save minus version, personas: {...}}))` → valid `SaveData`, `personas` intact (was `null` pre-change).
  - `migrate({version: SAVE_VERSION+1})` → `null`; `migrate({version: 1.5})` → `null`; `migrate({version: -1})` → `null`.
  - v0→v1 step adds only `version`: `MIGRATIONS[0]({a:1,b:2})` deep-equals `{a:1,b:2,version:1}`.
  - existing v1/v2 round-trip assertions unchanged (regression guard).

### Risks
- A save legitimately written with no version must be the *pre-v1* shape (all additive-optional). It is — v1 was the first stamped version and every field since is additive. The no-op step is therefore safe.
- Do not accidentally accept `version: null` as 0 — only `undefined` (absent) coerces to 0; `null` is a non-number → rejected. Use `=== undefined`, not falsy check.

### Estimated touch count
~2 files (saveGame.ts + one test file).

---

## Shipped (Coder)

**Lore track — BACKLOG-012:**
- Created `game/src/ai/plan.ts` (DayPlan, DAY_PHASES, proceduralPlan, activeIntent, planShape).
- `game/src/ai/intent.ts`: extracted `pickKind()`; `proceduralIntent` now calls it (byte-identical).
- `game/src/scenes/WorldScene.ts`: `plans`+`intentPhase` caches; `ensurePlan()`; `ensureIntent()` reworked phase-aware (LLM `intend` upgrade unchanged, now colors the active-phase note only); `__setIntent` pins the phase; new `__plan` hook; `bookRows()` adds `plans:`. Dropped now-unused `proceduralIntent` import.
- `game/src/ui/lenses.ts`: `BookRow.plans?`; `bookLines` renders a `plans:` line.
- Tests: `tests/unit/cycle-092-plan.test.ts`, `tests/e2e/cycle-092-plan.spec.ts`.

**Structure track — BACKLOG-426:**
- `game/src/world/saveGame.ts`: `MIGRATIONS[0]` (v0→v1 no-op); `migrate()` coerces absent version to 0 and lowers the floor `<1`→`<0` (present-but-non-number/non-integer/negative/newer still rejected). Doc-comment updated.
- Tests: `tests/unit/cycle-092-save-v0.test.ts`; updated the three older assertions that encoded the now-overturned "versionless/v0 rejected" contract (`cycle-061-save-version.test.ts` ×2, `saveGame.test.ts` ×1) to the rooted-at-v0 behaviour.

**Deviations:** none beyond the three intended old-test updates above (the contract 426 reverses).

**Status:** `npm --prefix game run build` clean; `npm run test:unit` 1005 passed (111 files); dev server HTTP 200; web-llm boundary clean (ai/ only). E2E left for QA.
