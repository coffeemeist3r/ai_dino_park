# Cycle 179 — Codeplan

Build order: 586 first (585's voice reads `went`).

## Structure track — BACKLOG-586

**Files to create**
- `game/src/ai/place.ts` — `planPlace`, `errandLine`, `headingLine`, `ERRAND_GLYPH`, `ERRAND_ART_KEY`.
- `game/src/ai/cycle-179-minds.test.ts` — unit for both tracks.
- `tests/e2e/cycle-179-minds.spec.ts` — e2e for both tracks.

**Files to modify**
- `game/src/scenes/WorldScene.ts` — `places` cache, `went` (day-scoped); `placeOf(d)`; `runErrand()` called from
  `maybeMigrate`; hooks `__errand`, `__place`; book `heading`.
- `game/src/ui/lenses.ts` — `BookRow.heading` + render line.

**Reuse** — `zoneNeighbors`, `zoneOf`, `zoneById`, `startMigration`, scene `zoneAppeal`, `ZONE_FLOOR`, `hashSeed` /
`mulberry32`, `ensurePlan`, `dayPhase`, `logEvent`, `popMark`.

## Lore track — BACKLOG-585

**Files to modify**
- `game/src/ai/reflection.ts` — `Reflection.said?` / `went?`; `dayVoice`, `daySummary`; `reflectionLine` appends the
  quote; `parseReflection` keeps string `said`/`went`.
- `game/src/ai/brain.ts` — optional `reflect?(ctx, summary)`.
- `game/src/ai/webllmBrain.ts` — `reflect` (ready-only, `cleanReply(…, 1)`, failure → null).
- `WorldScene.ts` — `checkReflection` fills `went` + `said`, bubbles, fires `reflect`; `seedFoundingReflections` adds `said`.

**Reuse** — `RIVAL_BAR`, `bondPoints`, `hashSeed`, `allowAmbient`, `ensurePersona`, `replyPrefix`, `showBubble`.

**New dependencies:** none. **Save:** additive optional fields only, no version bump.

**Test plan** — unit: planPlace rules, errandLine; dayVoice buckets/variants/went; parse keeps/drops `said`.
e2e: founding `said` + book quote; dusk bubbles; `__errand` launches a forage/restless dino with 🧭; once per phase;
floor holds.

**Risks** — errands run on the ambient cadence, which specs pause, so the e2e suite is shielded. Dusk now raises a
bubble per dino in view at 17:00, which may crowd `__bubbleTexts` reads in specs that cross 17:00.

## Shipped

- 586: `ai/place.ts` (`planPlace`, `errandLine`, `headingLine`); WorldScene `placeOf` (cached per day+phase, reads the
  live lean without triggering a fresh pick) + `runErrand` (one per migration tick, ahead of the roll; floor + sleepers
  respected); `went` filed for the dusk; book `heading:`; hooks `__errand`, `__place`.
- 585: `Reflection.said` / `went` (additive, parse keeps strings); `dayVoice` (seven moods × two name-seeded variants,
  leads with the place), `daySummary`; book quotes the line; founding yesterday voiced in `seedFoundingReflections`;
  `sayDay` at the dusk turn (floor bubble, then `NPCBrain.reflect` behind `allowAmbient`, 🧠-prefixed, only if the
  reflection is still today's); `reflect` on the WebLLM brain only.
- Scope creep (noted): `world/reachability.ts` registers `reflect` + `errand` as placed marks (so the art queue can
  draw them); `REFLECT_ART_KEY` exported in place of the `'reflect'` literal; `tests/e2e/cycle-028-realtime.spec.ts`
  pumps the clock before its baseline read — the previous CI run on `main` (37286861616) was red on it (61/62 vs 60
  on the slow Linux runner: wall time since the last tick leaked into the delta).
- Tests: `game/src/ai/cycle-179-minds.test.ts` (9), `tests/e2e/cycle-179-minds.spec.ts` (4).
