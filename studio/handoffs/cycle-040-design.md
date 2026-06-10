# Cycle 40 — Design

**Item** — BACKLOG-159 [social] Season foundation — a turning year on the realtime clock.

**Why this cycle**
The lore-smith's next-up, operator-seeded (Idea Box, cycle 37). The realtime fishbowl's whole
promise is that leaving it running accrues history — but the bowl lives in one endless season, so
day 30 looks exactly like day 2. A turning year is the cheapest visible history there is, and it's
the spine four fresh lore items (170–173) plus festivals (026) and weather (028) all build on.
Foundation only, per the item: clock + tint + one turn beat; no seasonal art, no weather.

**What ships**
- A pure, Node-testable `world/seasons.ts`:
  - `SEASONS = ['spring', 'summer', 'fall', 'winter']` and `type Season`.
  - `SEASON_LENGTH_DAYS = 7` — a week per season, 28-day year, wrapping forever (day 1–7 spring,
    8–14 summer, …, 29 spring again).
  - `seasonFor(day): Season` — pure mapping (1-indexed days, matching `GameTime.day`).
  - `seasonTurned(prevDay, day): Season | null` — the new season iff the boundary was crossed
    moving forward, else null.
  - `SEASON_TINT: Record<Season, { color: number; alpha: number }>` — a *subtle* full-map wash:
    spring fresh green, summer warm gold, fall burnt orange, winter pale blue; **alpha ≤ 0.12**
    so the day/night overlay stays dominant. Four visibly distinct colors.
  - `turnLine(season): string` — the banner ("The season turns — winter settles over the bowl"
    flavour, one line per season).
  - `turnMemory(season): string` — the memory each dino files ("the season turned to winter").
- WorldScene glue only:
  - A season-tint rectangle under the day/night overlay (one `add.rectangle`, refreshed on the
    day boundary — the `skyOverlay` pattern at a lower depth).
  - The clock HUD line gains the season: `Day N — HH:MM · spring`.
  - On the day rollover (hour listener already exists): `seasonTurned(prev, now)` → a fading
    center-screen banner (the keeper-invite non-modal pattern), a ticker `logEvent`, and every
    dino files `turnMemory` (rides the existing persisted store). Fires **once per turn**,
    live-observed only: boot, save-restore, and the away fast-forward must not retro-fire the
    banner (the away digest can mention seasons in a later item).
  - Dev hooks: `__season()`, `__seasonTint()`.
- **No save-format change** — the season derives entirely from the existing persisted `day`.

**Acceptance criteria**
- [ ] `world/seasons.ts` is pure (no Phaser import) and unit-tested in Node.
- [ ] `seasonFor`: days 1–7 → spring, 8 → summer, 22 → winter, 29 → spring (wraps); 1-indexed.
- [ ] `seasonTurned` returns the new season exactly on a boundary crossing (7→8 = summer),
      null within a season (3→4), null when not advancing (8→8, 8→7).
- [ ] `SEASON_TINT` has four distinct colors and every alpha ≤ 0.12.
- [ ] `turnLine`/`turnMemory` name the season; deterministic.
- [ ] e2e: fresh boot (day 1) — HUD contains `spring`, `__season()` is `'spring'`, and **no turn
      banner/memory fired** (boot is not a turn).
- [ ] e2e: advancing the clock across day 7→8 flips `__season()` to `'summer'`, updates the HUD,
      fires the banner/ticker once, and files the turn memory on a dino.
- [ ] e2e: the season tint overlay is present with the expected `SEASON_TINT` color and its alpha
      never exceeds 0.12 (day/night legibility preserved).
- [ ] No save-format change; every pre-existing spec passes; build + full suites green.

**Out of scope**
- Seasonal art/palette swaps of sprites or tiles (the art lift deferred by the item itself).
- Weather (028), festivals (026), the four seasonal-behavior follow-ups (170–173).
- Retro-firing turns missed while away (a later away-digest item may surface them).
- Plaque/book season surfacing beyond the clock HUD (172 owns birthdays).

**Constraints**
- Pure module imports nothing but types (and may share the `Tint` shape from `dayNight.ts`).
- Do not modify `clock.ts` or `dayNight.ts` behavior — seasons *read* the clock; the day/night
  overlay stays untouched and visually dominant.
- The turn beat must be non-modal (no dialog state) and must not fire from `set()`/restore paths.
- No new keys, no new deps, no save change. NPCBrain boundary intact.
