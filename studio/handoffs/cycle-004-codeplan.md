# Cycle 4 — Code-plan

## Item
BACKLOG-010 [ai] NPC personality traits.

## Files to create
- `game/src/ai/personality.ts` — pure, no Phaser.
  - `export interface Personality { curiosity: number; sociability: number; energy: number; agreeableness: number; bravery: number }` (each 0..1)
  - `export const AXES` — array of `{ key, low, high }` pole labels (single source of truth for keys + describe).
  - `export function seededPersonality(seed: string): Personality` — string hash → mulberry32 PRNG → 5 draws. Deterministic per seed.
  - `export function describePersonality(p: Personality): string` — dominant pole per axis (`> 0.6` high, `< 0.4` low), joined; `'even-tempered'` if none dominant.
- `tests/unit/personality.test.ts` — unit tests incl. the stub-brain mood assertions (imports `makeBrain`), to keep the file count at the ceiling.
- `tests/e2e/cycle-004-personality.spec.ts` — `__dinoTraits()` shape check + dialog regression.

## Files to modify
- `game/src/ai/brain.ts`
  - `NPCContext` gains `traits?: Personality` (import the type).
  - `StubBrain.respond` derives mood from `ctx.traits` when present: `bravery <= 0.2` → `wary`; else `sociability >= 0.8 && agreeableness >= 0.7` → `happy`; else `energy >= 0.65 && curiosity >= 0.6` → `excited`; else `neutral`. No traits → `neutral` (unchanged). Canned text unchanged.
- `game/src/entities/dino.ts`
  - `DinoConfig` gains `traits?: Personality`.
  - `Dino` stores `readonly traits: Personality = cfg.traits ?? seededPersonality(cfg.name)`.
  - `greet()` includes `traits: this.traits` in the `NPCContext`.
- `game/src/scenes/WorldScene.ts`
  - Dev hook `window.__dinoTraits = () => this.dinos[0]?.traits` (mirror `__clockNow` pattern).

## Reuse list
- `NPCContext` / `NPCBrain` / `Reply` from `ai/brain.ts` — reuse; traits ride the existing context, no boundary breach.
- `Dino.name` as the personality seed — reuse, no new id concept.
- The `__clockNow` dev-hook pattern — mirror for `__dinoTraits`.
- `AXES` drives both the `Personality` keys and `describePersonality` — no duplicated axis list.

## New dependencies
none — hash + PRNG are ~10 lines of arithmetic. CHARTER forbids adding an RNG lib.

## Test plan
### Unit (vitest) — `tests/unit/personality.test.ts`
- `seededPersonality('Rex')` equals a second `seededPersonality('Rex')` (deterministic); all 5 axes are finite numbers in [0,1].
- `seededPersonality('Rex')` vs `seededPersonality('Mossback')` differ on ≥1 axis.
- `describePersonality({curiosity:0.9,sociability:0.9,energy:0.5,agreeableness:0.5,bravery:0.9})` contains `curious`, `social`, `bold`; excludes `cautious`, `solitary`, `timid`.
- `describePersonality` of all-0.5 → `'even-tempered'`.
- stub brain: timid personality (`bravery:0.1`) → mood `wary`; social+warm (`sociability:0.9,agreeableness:0.8`) → mood `happy`.
### E2E (playwright) — `tests/e2e/cycle-004-personality.spec.ts`
- boot → `__dinoTraits()` has all 5 numeric axes within [0,1].
- regression: approach Rex, press Z, dialog shows non-empty `Rex: ...` text.
- existing smoke / day-night / save suites stay green.

## Risks
- **mulberry32 seeding:** a weak string hash could collide for short names — use a 32-bit mixing hash (e.g. cyrb-style) so 'Rex' and 'Mossback' diverge. Covered by the "differ on ≥1 axis" test.
- **Back-compat:** `traits` optional everywhere; the two existing brain tests pass unchanged (no traits → neutral). Verify they still run.
- **e2e dialog timing:** `greet()` is async; the dialog first shows `Rex: ...` then the reply. Assert the reply text is non-empty after a short wait, as the cycle-1 keyboard smoke does.

## Estimated touch count
6 files (1 new src, 3 modified src, 1 new unit, 1 new e2e). At the ceiling. Mood tests folded into `personality.test.ts` to avoid a 7th touch; `brain.test.ts` left untouched (and must stay green).
