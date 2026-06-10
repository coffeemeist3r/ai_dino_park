# Cycle 40 — Code Plan

**Item** — BACKLOG-159 [social] Season foundation — the turning year.

## Files to create

1. `game/src/world/seasons.ts` — pure, no Phaser. Exports:
   - `SEASONS = ['spring', 'summer', 'fall', 'winter'] as const`, `type Season`.
   - `SEASON_LENGTH_DAYS = 7`.
   - `seasonFor(day: number): Season` — `SEASONS[Math.floor(((day - 1) / SEASON_LENGTH_DAYS)) % 4]`
     (1-indexed `GameTime.day`, wraps).
   - `seasonTurned(prevDay: number, day: number): Season | null` — new season iff
     `day > prevDay && seasonFor(day) !== seasonFor(prevDay)`.
   - `SEASON_TINT: Record<Season, Tint>` (import the `Tint` type from `dayNight.ts`) —
     spring `0x58c04a`, summer `0xe8c050`, fall `0xd07030`, winter `0x90b8e0`; alphas 0.08–0.12,
     all ≤ 0.12.
   - `turnLine(season): string` — one flavoured banner line per season (record, not template).
   - `turnMemory(season): string` — `` `the season turned to ${season}` ``.

2. `tests/unit/seasons.test.ts`
3. `tests/e2e/cycle-040-seasons.spec.ts`

## Files to modify

1. `game/src/scenes/WorldScene.ts`:
   - fields: `seasonOverlay!: Rectangle`, `lastSeasonDay = 1`, `seasonTurns = 0` (transient).
   - `setupSeasons()` (call from `create()` after `setupDayNight`): overlay rect at **depth 4**
     (grass 0 < seasons 4 < night 5), filled from `SEASON_TINT[seasonFor(day)]`;
     `getWorldClock().onHour((t) => this.checkSeasonTurn(t))` — onHour already fires on the day
     wrap (`clock.ts:131`); hooks `__season`, `__seasonTint`, `__seasonTurns`.
   - `checkSeasonTurn(t)`: `const turned = seasonTurned(this.lastSeasonDay, t.day)`; always
     `this.lastSeasonDay = t.day`; if turned → repaint overlay, refresh clock HUD, fading
     center banner with `turnLine` (copy `showKeeperInvite`'s non-modal tween pattern),
     `logEvent('🍂 ' + turnLine)`-style ticker line, `remember(...turnMemory)` for every dino,
     `seasonTurns++`, `void this.saveGame()`.
   - `fmtClock` (~1550): append `` ` · ${seasonFor(t.day)}` ``.
   - **Restore path** (~1692, after `clock.set`): `this.lastSeasonDay = clock.now().day` +
     repaint overlay — sync WITHOUT beat.
   - New dev hook `__setClock(day, hour, minute)` — `clock.set(...)`, sync `lastSeasonDay`,
     repaint tint + season + HUD; mirrors the restore path so e2e can stage a boundary without
     a beat. (Needed because `__advanceWall` over > 1440 in-game minutes takes the
     `MAX_CATCHUP_TICKS` jump branch in `clock.ts:143` — `set()`, **no listeners, no beat** —
     so a test can't just advance 7 days and expect a turn.)

2. `BACKLOG.md` — validator closes on APPROVED.

## Reuse list (MUST use, not reinvent)

- `getWorldClock().onHour` — fires on day wrap already (`clock.ts:131`); do NOT add a tick poll.
- `Tint` type — `world/dayNight.ts:11`; the night overlay rect pattern (`WorldScene.ts:1608`).
- `showKeeperInvite` fading-banner pattern (`WorldScene.ts:~1380`) — non-modal, self-destroying.
- `remember`/`logEvent` — existing memory + ticker grammar.
- `__advanceWall` (`WorldScene.ts:1594`) — e2e crosses the boundary with a SMALL advance after
  `__setClock(7, 23, 59)` (2 in-game minutes; at the default 1× scale that's 120 000 wall-ms).
- `fmtClock` — single place the HUD string is built; both callers (tick + restore) get the
  season for free.

## New dependencies

none.

## Test plan

**Unit — `tests/unit/seasons.test.ts`** (~7):
1. `seasonFor`: 1→spring, 7→spring, 8→summer, 15→fall, 22→winter, 28→winter, 29→spring (wrap).
2. Year 2+ wrap: 36→summer.
3. `seasonTurned(7, 8)` = 'summer'; `(3, 4)` = null (same season); `(8, 8)` and `(8, 7)` = null
   (not advancing); `(7, 15)` = 'fall' (multi-day jump reports the *current* season).
4. `SEASON_TINT`: 4 distinct colors; every alpha ≤ 0.12.
5. `turnLine` distinct per season, contains the season name; `turnMemory` contains the name.
6. Determinism double-call.
7. `SEASONS` length 4 in the spring/summer/fall/winter order (pins the mapping).

**E2E — `tests/e2e/cycle-040-seasons.spec.ts`** (~4):
1. Fresh boot: HUD text contains `spring`, `__season()` = 'spring', `__seasonTurns()` = 0,
   console clean (boot is not a turn).
2. `__setClock(7, 23, 59)` (no beat — `__seasonTurns()` still 0), then `__advanceWall(120_000)`:
   `__season()` = 'summer', HUD contains `summer`, `__seasonTurns()` = 1, a dino's `__memory`
   includes 'the season turned to summer', ticker `__events()` mentions the turn.
3. Tint discipline: `__seasonTint()` matches `SEASON_TINT` for the live season and alpha ≤ 0.12;
   after the turn the overlay color changed to summer's.
4. Restore guard: save (`__saveNow`), reload + boot — `__seasonTurns()` = 0 again (transient),
   no banner from restore, `__season()` still reads from the restored day.

**Suite:** build + `npx vitest run` + `npx --yes kill-port 5173 && npx playwright test`.

## Risks

- **`__advanceWall(120_000)` at non-1× scale:** the T key can flip scale to 60×; tests must not
  press T. Default boot scale is 1× — fine. (If cycle-028's spec toggles scale it does so in its
  own page context; contexts don't leak.)
- **The away/catch-up jump path** (`clock.ts:145` `set()`) fires no hour listeners, so a
  long-gap boot can move days without a beat — by design (live-observed only). The restore sync
  (`lastSeasonDay = day`) covers the digest path too since it runs after `applyAway`.
- **onHour cadence:** `checkSeasonTurn` runs 24×/in-game-day; it must be O(1) when no turn
  (one `seasonFor` comparison) — keep the repaint inside the `if (turned)`.
- **Banner overlap with keeper invite** on a fresh boot is impossible (turn needs day ≥ 8).
- `fmtClock` change touches every HUD assertion — grep e2e for `__clockHudText` expectations
  (cycle-001/028 may pin exact strings; if they assert `Day N — HH:MM` by prefix/contains they
  survive; if exact-match, update those assertions in the same fire and note it).

## Estimated touch count

~5 files (1 new src, 1 modified src, 2 new tests, BACKLOG by validator). At budget.
