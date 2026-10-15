# Cycle 187 — Code Plan

## Structure track — BACKLOG-602 (build first)

**Files to create:** `game/src/world/growth.ts`, `game/src/world/cycle-187-growth.test.ts`, `tests/e2e/cycle-187-growing-up.spec.ts` (shared with lore).

**Files to modify:**
- `game/src/world/founding.ts` — `FOUNDING_GROWTH` (Pip; youth ends day 1 14:00).
- `game/src/world/saveGame.ts` — `growth?: Record<string, GrowthRecord>` on `SaveData` (optional, additive).
- `game/src/entities/dino.ts` — `traits` writable.
- `game/src/ui/lenses.ts` — `BookRow.growth?`, rendered after `child of`.
- `game/src/scenes/WorldScene.ts` — `growth` field; `seedFounding` seeds it (`??=`); load restores it; `applyGrowth()`
  sets scale + restored traits after seed/load; `voiceOf(d)` replaces the five `chirpParams(d.traits)` sites;
  `bookRows` adds `growth`; save writes it; hooks `__growth`, `__stageOf`, `__dinoScale`.

**Reuse list:** `timeToAbs` / `getWorldClock` (`world/clock.ts`), `chirpParams` (`audio/chirp.ts`), `FOUNDING_DAY`/
`FOUNDING_HOUR`, the `!save` seed path, the `born` save pattern.

**New dependencies:** none.

**Test plan:** unit — stage boundaries, no-record adult, `moltDue`, `youngVoice` pitch up, founding calibration vs
`ACTIVE_SCALE` and the festival window. e2e — fresh save Pip young at 0.5, book line, others adult.

**Risks:** e2e specs that jump the clock past day 1 14:00 will now see Pip molt (bubble + agreeableness +0.15).
Watch Pip-touching specs in the full run.

## Lore track — BACKLOG-023

**Files to create:** `game/src/world/molt.ts`, `game/src/world/cycle-187-molt.test.ts`.

**Files to modify:** `game/src/scenes/WorldScene.ts` — `checkMolts()` on the world tick → `moltDino(d)`: kind from
`bondPoints`/grudge of best friend/worst rival, traits, record, tween, bubble, chirp, ticker, `remember`, shed mark
(`hasPropArt('molt')` ? baked : 🐚 text, destroyed after 90 s); hook `__moltNow(name)`.

**Reuse list:** `bondPoints` (`social/bonds`), `worstRival`/`RIVAL_BAR` (`social/grudges`), `CLOSE_BOND`
(`social/closest`), `bestFriendOf`, `showBubble`, `logEvent`, `remember`, `hasPropArt`/`bakePropArt`, `chirpFor`.

**Risks:** the reachability register fails on a `PROP_RIGS` key the world cannot place — the scene must place
`molt` so 603's rig has a host.

**Estimated touch count:** ~11 files.

## Shipped

**Files touched:** `game/src/world/growth.ts` (new), `game/src/world/molt.ts` (new), `game/src/world/founding.ts`,
`game/src/world/saveGame.ts`, `game/src/world/reachability.ts`, `game/src/entities/dino.ts`, `game/src/ui/lenses.ts`,
`game/src/scenes/WorldScene.ts`, `game/src/world/cycle-187-growth.test.ts` (new), `game/src/world/cycle-187-molt.test.ts`
(new), `tests/e2e/cycle-187-growing-up.spec.ts` (new). 11 files.

**Deviations:**
- Scope creep (1 file): `world/reachability.ts` registers `molt` as a world-placed prop, so 603's rig has a host the
  register can see before the Artist draws it.
- The scene's helper is `chirpOf(d)`, not `voiceOf` — `voiceOf` already names the 585 day-voice. The test hook is
  `__traitsOf(name)`: a later `__dinoTraits` (dinos[0] only) already exists and overrode the first attempt.
- The voice change reaches the book, `chirpFor` (meet speaker + chorus) and the parents' voice line; the callback cue
  and distress cry still read raw traits (they go through `callbackCues`/`distressParams`) — noted, not widened.
- The husk is drawn only if its tile is in view at the molt (90 s life); not re-shown on a zone change.

**Build:** clean. **Unit:** 3365 green (325 files). **Boundary:** web-llm only under `game/src/ai/`.
