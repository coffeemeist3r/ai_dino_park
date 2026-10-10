# Cycle 183 — Code Plan

One new pure module shared by both tracks; thin scene glue modelled on the sky event (`setupSkyEvent`/`stepSky`).

## Structure track — BACKLOG-596

**Files:**
- `game/src/world/festival.ts` (new): `FESTIVAL_HOUR`, `FESTIVAL_HOURS`, `FESTIVAL_DURATION_MIN`, `FESTIVAL_TILE`
  (6,4), `FESTIVAL_CHECK_MS`, `seasonIndex(day)`, `festivalDue(t, lastSeason)`, `festivalBanner`,
  `festivalClosedLine`, `Guest`, `zonesWithGuestsHome(zones, guests)`.
- `game/src/world/saveGame.ts`: optional `festivalSeason` (integer ≥ -1), validated like `councilTermDay`.
- `game/src/scenes/WorldScene.ts`: `festival` + `festivalSeason` fields; `setupFestival` (3 s real-time timer gated
  by `ambientPaused`; hooks `__checkFestival`, `__openFestival`, `__closeFestival`, `__festival`,
  `__festivalSeason`, `__saveZones`); `checkFestival`, `openFestival`, `closeFestival`, `stepFestival`, `stepAway`,
  `showFestivalBanner`. `forceStep` calls `stepFestival` right after `stepSky`; the main per-dino loop skips guests
  walking home; `maybeMigrate` returns early while a festival exists; `currentSaveData` writes guests home and the
  season index (absent until one is held, so an old save round-trips).

**Reuse:** `atGather` + `stepToward` (sky event), `setZone`/`zoneOf`, `applyZoneVisibility`, `showBubble`,
`remember`, `absMinNow`, `currentSeason`, the season-turn banner style.

## Lore track — BACKLOG-594

**Files:** `festival.ts`: `festivalSulkers` (reuses `worstRival`), `festivalLeader` (reuses `bondPoints`),
`festivalRing`, `openingLine` (the 139 register split), `sulkLine`, `festivalMemory`. Glue in `openFestival`.

## Test plan
- Unit `game/src/world/cycle-183-festival.test.ts`: calendar window/once, guest zones in the save, save field
  round-trip + refusal, founding leader/sulkers, rings, registers, memories.
- E2E `tests/e2e/cycle-183-festival.spec.ts` (`foundingState('as-shipped')`): calendar opens at 10:00 not 09:00; ten
  attendees, five guests in the bowl, save writes them home; everyone inside its ring; Sunny on the tile, the feud
  at the edge; memories; close → guests home, no second festival this season.

**Save:** additive optional field only.
