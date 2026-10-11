# Cycle 184 — Code Plan

Both tracks extend `game/src/world/festival.ts` + its glue in `WorldScene`.

## Structure track — BACKLOG-597

- `festival.ts`: `Rite`, `FESTIVAL_RITES`, `festivalRite(season)`, `RITE_TILE` (5,3), `FESTIVAL_ART_KEYS`;
  `festivalBanner`/`festivalClosedLine` take the rite glyph + name; `festivalMemory` names the rite.
- `reachability.ts`: the four keys join `worldPlacedProps()`.
- `WorldScene.ts`: `festivalMark` field; `openFestival` places `makeHourMark(rite.artKey, rite.glyph)` at
  `RITE_TILE`, leader bubble takes the rite glyph, circle attendees float `rite.bubble`; `closeFestival` destroys
  the mark. Hook `__festivalMark()` → `{ key, tileX, tileY } | null`.

**Reuse:** `makeHourMark` (texture-or-glyph), `showBubble`, `currentSeason`.

## Lore track — BACKLOG-595

- `festival.ts`: `FestivalTale`, `festivalOpener(name, tale, traits)` (the 139 register split).
- `WorldScene.ts`: transient `festivalTales` filled in `closeFestival` for every attendee still present; read in the
  greet opener chain below 139's `thank`, above `toneEcho`, consumed by its line. Hook `__festivalTales()`.

## Test plan
- Unit `game/src/world/cycle-184-festival.test.ts`: rites distinct, banner/closed/memory per season, art keys
  placed, the five opener registers. Update `cycle-183-festival.test.ts` memory strings.
- E2E `tests/e2e/cycle-184-festival-rites.spec.ts` (`foundingState('as-shipped')`): spring mark placed/removed,
  winter rite at day 22, memories name the rite; tales after close (not before), Sunny proud once, Mossback names
  Twitch. Update the cycle-183 spec's memory strings.

**Save:** none (tales are transient, like 139's thanks).
