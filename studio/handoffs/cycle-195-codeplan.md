# Cycle 195 — Codeplan

## Lore track — BACKLOG-624

**Files to modify:**
- `game/src/social/courtship.ts` — `CourtContext.grudges?: Bonds`; `Courtship.grudge?: true` when a grudge ≥ `RIVAL_BAR` turned it down; `Courtship.cameRound?: true` when a sub-bar grudge pairs anyway. `courtTicker` / `courterMemory` gain the two variants.
- `game/src/scenes/WorldScene.ts` `courtBeat` — pass `this.grudges`; on a grudge refusal the courted bubbles `SCOFF_GLYPH`.

**Reuse:** `RIVAL_BAR` + `bondPoints` (`social/grudges.ts`, `social/bonds.ts`); `SCOFF_GLYPH` (`world/faith.ts`).

**Tests:** `game/src/social/cycle-195-grudge.test.ts` (unit); `tests/e2e/cycle-195-wedding.spec.ts` (shared spec file, refusal case).

## Structure track — BACKLOG-625

**Files to create:** `game/src/social/wedding.ts`, `game/src/social/cycle-195-wedding.test.ts`, `tests/e2e/cycle-195-wedding.spec.ts`.

**Files to modify:**
- `courtship.ts` — `Pairs` entry `wed?: number`; `isPairs` validates; `mateBookLine` wed variant.
- `WorldScene.ts` — `wedding` field; `checkWedding` on the `setupCourtship` cadence timer; `stepWedding` beside `stepService`; ladder branch beside the service's; `weddingMark` visibility in the zone-visibility pass; hooks.

**Reuse:** `atGather` (`world/skyEvent.ts`), `stepToward`, `berthOf`, `makeHourMark`, `remember`, `FESTIVAL_CHECK_MS`, `absMinNow`, `isResting`, `zoneOf`.

**Risks:** the ladder branch pulls dinos around 15:00–16:00 on day 1, which could shift RNG streams in long e2e specs (RNG-stream luck memory); the branch draws no `rand()`, but positions differ. Run the full suite.

**Estimated touch count:** ~6 files.
