# Cycle 42 — Design

**Item** — BACKLOG-171 [emergent] Winter huddle pull — cold seasons lower the night-huddle bond threshold and lengthen the huddle window, so winter visibly packs the den while summer nights stay scattered.

## Why this cycle

Cycle 40 hung the calendar; cycle 41 let it change a *verdict* (which food wins). Both are reads
you have to probe for. This cycle the season changes behaviour you can watch from across the
room: in winter the den packs from dusk and holds past dawn — and even loosely-bonded dinos come
in from the cold — while in high summer the night is warm enough that nobody bothers until late
and the bowl stays scattered. The huddle is the oldest social ritual in the bowl (cycle 18) and
the season reaching it makes *who sleeps alone in winter* a sharp, free read on the bond graph —
distinct-minds emergence paid for, like cycles 40 and 41, in derived state only.

## What ships

A new pure module `game/src/world/huddle.ts` owning the season-conditional huddle rules, plus
thin WorldScene threading (the same shape as cycle 41's `foods.ts` season threading):

- **Per-season huddle config** (`SEASON_HUDDLE`): a bond threshold + a huddle window (start/end
  hour, wrapping midnight) per season:
  - **spring** — threshold 8, window 21→5 *(byte-identical to today's night phase — day 1 of a
    fresh clock is spring, so every existing boot/test sees exactly the old behaviour)*
  - **summer** — threshold 8, window **23→4** *(warm nights: the cast stays out past the old
    bedtime; at 21:30 in summer nobody is seeking the den)*
  - **fall** — threshold **6**, window 21→5 *(the first chill pulls the loosely-bonded in)*
  - **winter** — threshold **4**, window **19→7** *(the den packs from dusk and holds past
    dawn; near-strangers come in from the cold)*
- `huddleThreshold(season?)` and `inHuddleWindow(hour, season?)` — **season optional on both**;
  omitting it returns the legacy verdict (threshold 8, window = `dayPhase(hour) === 'night'`),
  byte-identical to cycle 18, exactly the cycle-41 compatibility discipline.
- **WorldScene** consults the live clock season (existing `currentSeason()`) in the movement
  step (den-seeking gate) and in `isHuddling()` (which feeds the 💤 sleep marks and the
  `__huddlers` hook), so what you see and what the tests read are the same verdict.
- **Visible result:** flip to winter and the cast converges on the den at 19:00 with 💤 marks
  through dawn; flip to summer and the same bowl at 21:30 is still wandering.
- Dev hook `__huddleInfo()` → `{ season, threshold, inWindow }` for the e2e.
- `__bondPair(a, b, amount?)` grows an optional amount (default unchanged) so a test can stage
  a *low* bond (e.g. 4) and prove winter admits it while the old threshold would not.

**To see it:** open the game, press nothing — on a fresh save (spring) nights look exactly as
before. In dev/e2e, `__setClock(22, 19, 30)` (a winter dusk) then step the world: bonded dinos
beeline for the den, 💤 marks appear, `__huddlers()` fills. `__setClock(10, 21, 30)` (a summer
night): nobody seeks the den, `__huddlers()` stays empty.

## Acceptance criteria

- [ ] Unit: with season omitted, `huddleThreshold()` returns 8 and `inHuddleWindow(h)` equals `dayPhase(h) === 'night'` for all 24 hours — legacy behaviour byte-identical.
- [ ] Unit: winter config — `huddleThreshold('winter') === 4`; `inHuddleWindow` true for hours 19..23 and 0..6, false for 7..18.
- [ ] Unit: summer config — threshold stays 8; window is 23..23 and 0..3 only; hours 21 and 22 are NOT huddle time in summer.
- [ ] Unit: fall config — threshold 6; window identical to spring (21→5).
- [ ] Unit: spring config is exactly the legacy verdict (threshold 8, window matches `dayPhase` night for all 24 hours).
- [ ] E2E: winter dusk pull — bond a pair ≥ 8, `__setClock` to a winter day at 19:30 (a time no prior season ever huddled), force steps: the pair converges on the den and `__huddlers()` becomes non-empty.
- [ ] E2E: winter admits the loosely-bonded — bond a pair to exactly 4 (below the old threshold), winter night: `__huddlers()` picks them up; the same staging in spring would leave them out (assert via `__huddleInfo().threshold`).
- [ ] E2E: summer scatter — bond a pair ≥ 8, `__setClock` to a summer day at 21:30, force steps: `__huddlers()` stays empty and `__huddleInfo().inWindow` is false.
- [ ] Regression: the cycle-018 huddle spec and the full unit + e2e suites stay green untouched (fresh clock = day 1 = spring = legacy behaviour by construction).

## Out of scope

- Cold-night shiver (179), odd bedfellows (180), sleep murmurs (181), night ledger (182) — they extend this once it lands.
- The away fast-forward (106/115) — its shared-night math stays season-blind this cycle.
- Egg-laying / `isClearNight()` — breeding stays gated on the plain night phase (no winter dusk eggs); weather is still BACKLOG-028.
- Migrating warmth (178) — daytime cluster-drift bias is its own item; this cycle touches only the den.
- Any tint/palette work — cycle 40 owns the season wash; this changes movement, not light.

## Constraints

- Pure logic in `game/src/world/huddle.ts` — no Phaser import; WorldScene only threads the season in (cycle-41 pattern).
- `season` optional on every new helper; omitted = byte-identical legacy verdict. No save-format change, no new keys, no new deps. NPCBrain not in play.
- `__bondPair`'s default behaviour must not change (existing specs call it bare).
- Don't touch `isClearNight()` / egg gates, the day/night keyframes, or the season tint — the cycle-002 and cycle-040 specs must pass untouched.
- The movement-priority order (inspection > food rush > huddle > drift/wander) must hold; winter widens *when* the huddle gate opens, not where it sits in the order.
