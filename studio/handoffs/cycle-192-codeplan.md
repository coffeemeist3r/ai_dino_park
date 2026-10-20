# Cycle 192 — Codeplan

## Lore track

**Item:** BACKLOG-615 — the word travels.

**Files to create:** `game/src/world/cycle-192-faith.test.ts` (shared with the structure track), `tests/e2e/cycle-192-faith.spec.ts` (shared).

**Files to modify:**
- `game/src/world/faith.ts` — `WORD_BOND = 12`; `Faith.heardFrom?: Record<string,string>`; pure `hearWord(faith, carrier, listener, bonds, grudges)` → `{ kind: 'believe' | 'scoff' } | null`; `wordTicker` / `wordScoffTicker` / `toldLine` / `toldMemory` / `wordScoffMemory`; `faithBookLine` appends `(heard it from X)`; `isFaith` validates `heardFrom`.
- `game/src/scenes/WorldScene.ts` — new `faithWordBeat(a, b)` called in `converse` beside `teachBeat`, both directions; `__faith` hook copies `heardFrom`/`shrine`.

**Reuse list:** `bondPoints` (social/bonds), `worstRival` (social/grudges), `faithOf`, `creedById`, `remember`, `showBubble`, `logEvent`, `__forceConverse` (e2e).

**New dependencies:** none.

**Test plan:**
- Unit: `hearWord` believe/scoff/null cases, grudge outranks bond, flock/part guards; founding read (Sunny→Rex believes, Mossback→Rex believes, Mossback→Twitch null because Twitch already scoffs, a fresh grudge scoffs); book line with `heardFrom`; `isFaith` with/without `heardFrom`.
- E2E: fresh save → sermon → `__forceConverse('Sunny','Rex')` → Rex believer, heardFrom, ticker, book row; reverse order; reload keeps heardFrom.

**Risks:** `converse` awaits the brain; the beat must run after the await in the try (same as `teachBeat`). Rex is an owl
and may be asleep — `converse` does not gate on sleep, so `__forceConverse` is deterministic.

**Estimated touch count:** ~4 files (shared).

## Structure track

**Item:** BACKLOG-614 — the faith raises a stone.

**Files to modify:**
- `game/src/world/faith.ts` — `SHRINE_RECIPE`, `SHRINE_BELIEVERS`, `SHRINE_GLYPH`, `SHRINE_ART_KEY`; `Faith.shrine?: Landmark`; pure `canRaiseShrine(faith, attendees, pile)`, `raiseShrine(pile)`; `shrineTicker`, `haulMemory`; `isFaith` validates `shrine`.
- `game/src/scenes/WorldScene.ts` — `checkService` raises the shrine after the attendees are known; `placeFaithMark` picks shrine art/glyph when raised; `applyObjectVisibility` fades a derelict shrine; `landmarksIn` + `landmarkRecords` include the shrine (upkeep + mend for free); `__faithMark` reports alpha + shrine flag.

**Reuse list:** `Landmark` + `DERELICT_ALPHA` (world/upkeep), `pileFor`/`setPile`, `makeHourMark`, `refreshPlaque`, `__setZonePile`, `__runUpkeep`, `__landmarks`, `__standing` (e2e).

**New dependencies:** none.

**Test plan:**
- Unit: `canRaiseShrine` gates (no shrine, ≥3 believers, ≥3 attendees, pile); `raiseShrine` spend; `isFaith` with a shrine / malformed shrine.
- E2E: sermon → `__setZonePile('bowl', {stone: 2})` → 16:00 `__holdService` → shrine at sermon tile, pile 0 stone, ticker, `__landmarks('bowl')` length+1; short pile → no shrine; upkeep derelict → faded mark; reload keeps shrine.

**Risks:** the shrine is the newest landmark in `landmarkRecords`, so upkeep lapses it first when the bill can't be paid — acceptable (newest-first is the existing rule). `baseLandmarks` must not include it (granary gate). Specs that hit 16:00 after a sermon with ≥2 bowl stone will now see a shrine; the 191 spec sets the clock with ~0 stone, so it is unaffected.

**Estimated touch count:** same 4 files.
