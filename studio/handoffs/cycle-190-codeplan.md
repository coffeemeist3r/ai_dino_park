# Cycle 190 — Code plan

## Structure track — BACKLOG-609 (lands first)

**Files to modify:**
- `game/src/world/growth.ts` — `standingCandidate<C extends { role; foodBanked }>(c, young)`: young → `{ ...c, role: 'wanderer', foodBanked: 0 }`, else `c`.
- `game/src/world/term.ts` — `grownSeatLine(name, zoneName)` beside `turnoverLine`.
- `game/src/scenes/WorldScene.ts` — `zoneCandidates` maps through `standingCandidate(…, stageNow === 'young')`; `moltDino`
  logs `grownSeatLine` when `councilFor(zone)` includes the grown dino (after the record is written).
- `game/src/world/founding.ts` — council comment: Bramble sits the Grove's morning, Pip takes the seat at the molt.
- `tests/e2e/cycle-137-ballot.spec.ts` — molt Pip before asserting the Pip seat.

**Reuse:** `stageNow`, `councilFor`, `zoneOf`, `zoneById`, `theZone`, `logEvent`. No new comparator.

## Lore track — BACKLOG-313

**Files to modify:**
- `game/src/world/growth.ts` — `GrowthRecord.kept?: { from; glyph; label }`; `KEPT_EVERY = 4`; `keptBeat(step)`;
  `keptLine(ownLabel, kept)`.
- `game/src/scenes/WorldScene.ts` — `moltDino`: `kept` snapshotted from `copied` into the record; `refreshActivityMarks`:
  an adult with `kept`, no mood/lift, shows `kept.glyph` on `keptBeat(worldSteps)`; book `quirk:` uses `keptLine`.
- `tests/e2e/cycle-189-guardian.spec.ts` — the post-molt book quirk now carries the kept clause.

**Files to create:** `game/src/world/cycle-190-kept.test.ts` (both tracks' unit), `tests/e2e/cycle-190-kept.spec.ts`
(both tracks' e2e).

**Test plan:** unit — keptBeat, keptLine, standingCandidate (immutability), grownSeatLine. e2e — fresh save grove council
Bramble → molt → Pip + ticker; kept field + persistence across reload; book quirk; idle mark over steps after the 8s lift
window shows both glyphs.

**Risks:** any spec asserting the Grove's council/call before 14:00 (only 137 found by grep); `refreshActivityMarks`
runs per step, so `worldSteps % 4` cycles visibly.

## Shipped

**Files touched:** `game/src/world/growth.ts` (`kept`, `KEPT_EVERY`, `keptBeat`, `keptLine`, `standingCandidate`),
`game/src/world/term.ts` (`grownSeatLine`), `game/src/world/saveGame.ts` (validate `kept`), `game/src/world/founding.ts`
(council comment), `game/src/scenes/WorldScene.ts` (`zoneCandidates`, `moltDino`, `refreshActivityMarks`, book quirk),
`game/src/world/cycle-190-kept.test.ts`, `tests/e2e/cycle-190-kept.spec.ts`, `tests/e2e/cycle-137-ballot.spec.ts`,
`tests/e2e/cycle-189-guardian.spec.ts`. 9 files.

**Deviations / found:**
- **The structure handoff was wrong about the molt.** Pip's founding molt is `softer`, not `bolder` (bond 26 ≥
  `CLOSE_BOND` 25, by design since cycle 187), which lifts its agreeableness 0.522 → 0.672. So since cycle 187 the
  Grove's knife-edge ballot (492) only lived until 14:00; this item moves the morning seat to Bramble (0.870), and the
  founding park now carries **no turnable Grove seat at either hour**. The 137 mechanism tests put 0.522 back by
  `__setTrait` after the molt and say why. Flagged for the Validator: a follow-up structure item, not a hidden loss.
- `kept` is validated on load like the rest of the growth record (malformed → corrupt save, the file's policy).

**Build:** clean. **Unit:** 3393 passed (331 files). Targeted e2e (190, 189, 137, 187, 188): green.
Boundary: `@mlc-ai/web-llm` only under `game/src/ai/`.
