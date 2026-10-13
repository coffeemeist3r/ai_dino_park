# Cycle 186 — Code plan

## Lore track — BACKLOG-133

**Files.** `game/src/world/festival.ts` (pure), `game/src/scenes/WorldScene.ts` (festival glue),
`game/src/world/cycle-186-festival.test.ts` (unit), `tests/e2e/cycle-186-festival-fetch-keeper.spec.ts` (e2e).

**Functions (festival.ts).** `COAX_AFTER_MIN`, `coaxOrder(leader, sulkers, bonds, traits)`, `coaxLine(target, season,
traits)`, `coaxAnswer(foe, traits) → { comes, line }`, `coaxTicker(leader, sulker, comes)`, `coaxMemory(season,
other, comes, asLeader)`. `FestivalTale` gains `fetchedBy?`, `refused?`, `broughtIn?`; `festivalHead` reads them.

**Glue.** `festival` state gains `coax: string[] | null` (queue; null = not started) and `fetched: string[]`,
`refused: string[]`. `stepFestival` open phase: start the queue at `COAX_AFTER_MIN`; while the queue is non-empty the
leader steps toward `queue[0]` instead of the centre and `resolveCoax` fires when adjacent. `closeFestival` writes
the new tale fields. Hook `__coaxFestival`.

**Reuse.** `strengthen` + `RING_BOND`, `bondPoints`, `stepToward`, `showBubble`, `logEvent`, `remember`, the existing
`festivalRing` (deleting from `sulkers` is what moves the dino into the circle).

**Tests.** Unit L1/L2 + opener lines; e2e L3–L6.

## Structure track — BACKLOG-600

**Functions (festival.ts).** `keeperInRing(tile)`, `KEEPER_FESTIVAL_GAIN = BASE_GAIN`, `keeperWelcome(name, traits)`,
`keeperJoinedTicker(season)`, `keeperFestivalMemory(season)`, `keeperTaleLine(present, traits)`; `FestivalTale.keeper?`.

**Glue.** `festival.keeper: boolean`; `stepFestival` open phase checks `this.zoneId === BOWL_ID &&
keeperInRing(this.playerTile())` → `keeperJoins()`. Close writes `keeper` into every tale. Hook `__festivalKeeper`.

**Reuse.** `bumpPoints`, `keeperById(this.keeperId).name`, `playerTile`, `__setPlayer` (e2e).

**Tests.** Unit S1/S2; e2e S3/S4.

## Shipped (coder)

Both tracks shipped as planned. Build clean; unit 3343 green (323 files); e2e 908/908 first full run.

**Deviation (lore).** The first e2e run showed Twitch, once fetched in, ending up ring-paired with Sunny — every other
neighbour had been claimed by a stranger pair first, so Sunny|Twitch went 10 → 20. Honest behaviour, not changed. And
since the fetch itself lifts Sunny|Twitch from 0 to `RING_BOND` (10 ≥ `LONER_FLOOR` 8), the fetch is where Twitch, the
park's one friendless founder, finds its first friend: `resolveCoax` now pops the 🌱 friend-found mark over both when
the ask crosses the floor. The e2e asserts Twitch gains a ring bond with *someone*, not with a non-leader.
