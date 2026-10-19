# Cycle 191 — Code plan

## Shared module — `game/src/world/faith.ts` (new, pure)

- `CreedId = 'song' | 'stones' | 'sun' | 'water' | 'old' | 'sky'`; `Creed { id, name, short, glyph, sermon, believe }`;
  `CREEDS` (table order = match order, keyword RegExp each; `sky` the fallback, no keyword).
- `creedFor(persona: string): Creed`.
- `HEED_BOND = 10`; `SERVICE_HOUR = 16`; `SERVICE_MIN = 60`; `FAITH_EVERY = 5`; `FAITH_ART_KEY = 'faith-stone'`.
- `pickPreacher(cands: { name; curiosity; awake; home }[], host): string | null`.
- `hearSermon(preacher, hearers, bonds, grudges) → { believers, scoffers: Record<string,string>, unmoved }`
  (believers first by `bondPoints ≥ HEED_BOND`; scoffers by `worstRival(name, grudges, [preacher, ...believers])`).
- `Faith` record type; `faithOf(faith, name) → 'preacher' | 'believer' | 'scoffer' | null`.
- Lines: `sermonTicker`, `heardTicker(preacher, believers, scoffers)`, `faithBookLine(faith, name)`, memories
  (`preachMemory`, `believeMemory`, `scoffMemory`, `serviceMemory`), `serviceTicker`, `serviceClosedLine`.
- `faithBeat(step)`; `serviceDue(t, faith)`; `serviceAttendees(faith, present: { name; zone; awake; migrating }[])`;
  `isFaith(raw)` validator (used by saveGame).

## Structure track — BACKLOG-613 (lands first)

- `game/src/world/saveGame.ts` — `faith?: Faith` on `SaveData`; validate via `isFaith` (malformed → null); return it.
- `game/src/scenes/WorldScene.ts` —
  - fields `faith: Faith | null`, `service: { startAbsMin; attendees } | null`, `faithMark`.
  - `setupFaith()` (called beside `setupFestival`): 3 s cadence → `checkService()`; hooks `__faith`, `__service`,
    `__holdService`, `__closeService`.
  - `checkService()` → `openService()`; `stepService()` called in `forceStep` after the festival branch (closes on
    `SERVICE_MIN`); per-dino ladder: after the `arriving` branch, an attendee walks to the faith tile (ring 0 preacher /
    ring 1 believers) and `continue`s.
  - `placeFaithMark()` — `makeHourMark(FAITH_ART_KEY, creed.glyph)` at the faith tile; visibility in
    `applyObjectVisibility`; called after the sermon and after restore.
  - save `faith`, restore `this.faith = save.faith ?? null`.

## Lore track — BACKLOG-030

- `WorldScene.closeFestival` → `this.preachSermon(f)` after `ringMakesFriends` when `!this.faith`.
- `preachSermon`: candidates = attendees with `home` = guest home or bowl; awake = `!this.isResting(d)`; creed from
  `d.personality`; bubbles, tickers, memories; writes `this.faith`; `placeFaithMark()`.
- `refreshActivityMarks`: after `kept`, `faithGlyph` when `!mood && !lifted && !copied && !kept && faithBeat(step)` and
  `faithOf ∈ {preacher, believer}`.
- `bookRows` → `faith: faithBookLine(...)`; `ui/lenses.ts` `BookRow.faith?` rendered under `tic`.

## Files

Create: `game/src/world/faith.ts`, `game/src/world/cycle-191-faith.test.ts`, `tests/e2e/cycle-191-faith.spec.ts`.
Modify: `game/src/world/saveGame.ts`, `game/src/scenes/WorldScene.ts`, `game/src/ui/lenses.ts`. 6 files.

**Reuse:** `bondPoints`, `worstRival`, `RIVAL_BAR`, `remember`, `atGather`, `stepToward`, `makeHourMark`, `logEvent`,
`showBubble`, `isResting`, `zoneOf`, festival guests map.

**Test plan:** unit — creedFor over the founding roster, pickPreacher (sleepers/guests excluded), hearSermon on founding
bonds, faithBookLine three ways, serviceDue edges, serviceAttendees filters, save round-trip + malformed. e2e — fresh
save: open+close festival at day 1 10:00 → `__faith` Glade/song, believers' bonds ≥ 10, ticker lines, book lines;
second close does not re-preach; set clock 16:00 → `__holdService` open, attendees walk within ring 1; faith glyph
seen on the activity mark; reload keeps the faith.

**Risks:** specs asserting exact ticker contents after `__closeFestival` (grep `__closeFestival`); the per-dino service
branch must not touch festival guests (skip sits above it).

## Shipped

**Files touched:** `game/src/world/faith.ts` (new), `game/src/world/saveGame.ts` (`faith` field + `isFaith`),
`game/src/ui/lenses.ts` (`BookRow.faith`), `game/src/scenes/WorldScene.ts` (`setupFaith`, `preachSermon`,
`placeFaithMark`, `checkService`/`stepService`/`closeService`, service branch in the per-dino ladder, faith glyph in
`refreshActivityMarks`, book row, object visibility, save/restore), `game/src/world/cycle-191-faith.test.ts`,
`tests/e2e/cycle-191-faith.spec.ts`. 6 files.

**Deviations / found:**
- The creed reads the roster one-liner (`d.personality`), not the cached persona text: an LLM-authored persona would
  give a device-dependent creed, and the faith is a save fact. Noted for a later brain-sermon item.
- The faith mark (`faith-stone`) is placed with its glyph fallback now, so 616's rig has a host the night it is drawn.
- A service with fewer than two attendees is skipped but still marked held for the day, so it does not re-check
  every 3 s.

**Build:** clean. **Unit:** 3404 passed (333 files). Targeted e2e (191 + 183–190): green. Boundary: `@mlc-ai/web-llm`
only under `game/src/ai/`.
