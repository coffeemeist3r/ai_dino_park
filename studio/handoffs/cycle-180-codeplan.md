# Cycle 180 — Codeplan

## Lore track

**Item:** BACKLOG-589 — the ground answers a newcomer.

**Files to create**
- `game/src/ai/welcome.ts` — `answerArrival`, `welcomeText`, `welcomeLine`, `WelcomeKind`, `LONER`, `STRANGER_MET`.
- `game/src/ai/cycle-180-minds.test.ts` — unit tests for both tracks.
- `tests/e2e/cycle-180-minds.spec.ts` — e2e tests for both tracks.

**Files to modify**
- `game/src/scenes/WorldScene.ts` — `crossDino`: collect the 452/459 greeters, then call a new `answerNewcomer(d, dest, greeted)` at the end.

**Reuse list:** `RIVAL_BAR` (`social/grudges`), `CURIOUS` (`ai/companion`), `MISSES_COMPANY` + `Reflection` (`ai/reflection`),
`pairKey` (`social/meetings`), `hashSeed`/`mulberry32` (`ai/personality`), and the scene's `showBubble`, `logEvent`,
`zoneById`, `isRival`, `reflections`, `meetings`.

**New dependencies:** none.

**Test plan:** described in the design acceptance criteria. Unit tests in `cycle-180-minds.test.ts`. E2E drives the walk with `__migrate`, then `__startMigrationTo`, then `__stepWorld`, and reads `__ticker` / `__bubbleTexts`.

**Risks:** bubbles stacking at the arrival instant. Answerers are residents and never the newcomer, and greeters are excluded.

**Touch count:** ~4 files.

## Structure track

**Item:** BACKLOG-588 — the model's hand on whom and where.

**Files to modify**
- `game/src/ai/companion.ts`:
  - `SeekWhy` gains `'chosen'`, with its reason and arrival text.
  - New `foldChoice(draft, floor, companions)`.
  - New `shouldFollow(...)`.
- `game/src/ai/place.ts`:
  - New `foldPlace(go, floorDest, grounds)`.
  - New `followLine(name, zoneName, companion)`.
- `game/src/ai/brain.ts` — `ChoiceOptions`, `ChoiceDraft`, and optional `choose?` on `NPCBrain`.
- `game/src/ai/webllmBrain.ts`:
  - `parseChoice(raw, companions, grounds)` (pure, exported).
  - `choose()`, ready-engine only.
- `game/src/scenes/WorldScene.ts`:
  - `runErrand`: a follow pass ahead of the place pass.
  - `chooseSeek`: the async model fold.
  - Dev hook `__setChoose(seek, go)`, which installs a fixed `choose` on the live brain.

**Reuse list:** `hopToward` (`world/distance`), `ZONE_FLOOR`, `zoneHeads`, `startMigration`, `popMark` with `ERRAND_ART_KEY`,
`allowAmbient`, `replyPrefix('llm')`, `ensurePersona`, `zoneNeighbors`, `zoneById`.

**New dependencies:** none.

**Test plan:** see the design. Unit tests cover the folds, `parseChoice` and `shouldFollow`. E2E covers the fresh-park follow and the fake-brain fold.

**Risks:**
- The follow runs ahead of place errands, so it competes with them for the one errand per tick. That is intended: whom outranks where.
- The cycle-179 specs never step the world, so a zone never changes under them and no follow can fire.

**Touch count:** ~6 files (shared: WorldScene, the test files).

Cross-track: both tracks touch `WorldScene.ts` in disjoint methods. Order: 588, then 589.
