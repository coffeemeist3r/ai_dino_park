# Cycle 178 — Codeplan

Build order: 583 first (582's chooser reads `best`).

## Structure track — BACKLOG-583

**Item:** the dusk reflection.

**Files to create**
- `game/src/ai/reflection.ts` — `Reflection`, `reflectDay`, `foundingReflection`, `planAfter`, `reflectionLine`, `duskLine`, `REFLECT_HOUR = 17`, `REFLECT_GLYPH`.
- `game/src/ai/cycle-178-reflection.test.ts` — unit.
- `tests/e2e/cycle-178-minds.spec.ts` — e2e for both tracks.

**Files to modify**
- `game/src/world/saveGame.ts` — optional `reflections` field: type, parse (reject malformed), return.
- `game/src/scenes/WorldScene.ts` — `reflections` + `dawnMeetings` fields; snapshot at boot and on hour 5; `checkReflection` live `onHour` listener at 17; `seedFounding` seeds founding reflections; `__clearBonds` clears them; `ensurePlan` applies `planAfter`; save/restore; book row `yesterday`; hooks `__reflections`.
- `game/src/ui/lenses.ts` — `BookRow.yesterday` + render line.

**Reuse list** — `pairKey` (`social/meetings.ts`), `bondPoints` / `closestFriend` (`social/bonds.ts`), `popMark` / `logEvent` (WorldScene), the `grudges` save-parse block as the parse template, `onHour` live-only listener pattern (`checkUpkeep`).

**New dependencies:** none.

**Test plan** — unit: reflectDay best/met/ties/empty; planAfter lean rules + stale; save round-trip / malformed / absent. e2e: founding book line for Sunny; crossing 17:00 files today's reflections + ticker line.

**Risks** — a ring line would evict memories the hatch reads (581's complaint), so the reflection does **not** write to the memory ring; the record is the memory. Specs that advance across 17:00 get one extra ticker line.

**Estimated touch count:** ~6 files.

## Lore track — BACKLOG-582

**Item:** whom a mind goes looking for.

**Files to create**
- `game/src/ai/companion.ts` — `chooseCompanion`, `Companion`, `seekLine`, `arrivalText`, `seekingLine`, `SEEK_ART_KEY`, `SEEK_GLYPH`.
- `game/src/ai/cycle-178-companion.test.ts` — unit.

**Files to modify**
- `WorldScene.ts` — `seeking` map; choose in `ensureIntent` on a fresh phase (log + mark when the choice changes); socializing target = companion if on the same ground; arrival bubble once per phase in the meeting pass; book `seeking`; hook `__seeking`.
- `lenses.ts` — `BookRow.seeking` + render line.

**Reuse list** — `RIVAL_BAR` (`social/grudges.ts`), `bondPoints`, `pairKey`, `zoneOf` + `dinoZones`, `stepToward`, `showBubble`, `popMark`.

**New dependencies:** none.

**Test plan** — unit: founding bowl picks (Mossback→Twitch rival, Rex stranger, Sunny→Rex yesterday), zone-mates only, null on empty. e2e: `__seeking()` Mossback→Twitch + book line; a socializing step closes distance to the companion; a seek line in the ticker.

**Risks** — socializing now walks to a chosen dino, which can change which pairs meet in specs that relied on nearest-drift; run the full suite.

**Estimated touch count:** ~4 files (2 shared with 583).
