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
