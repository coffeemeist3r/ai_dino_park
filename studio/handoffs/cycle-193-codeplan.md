# Cycle 193 — Code plan

## Lore track

**Item:** BACKLOG-618 — the first courtship.

**Files to create**
- `game/src/social/courtship.ts`: pure. `COURT_BOND = 24`, `PAIR_BOND = 6`, `MATE_EVERY = 5`, `MATE_GLYPH = '💕'`,
  `type Pairs = Record<string, { mate: string; day: number }>`, `courtGift(persona)`,
  `courtship(a, b, ctx) → { courter, courted, accept: boolean } | null` (ctx: bonds, names, bravery map, young set, pairs),
  `pairUp(pairs, a, b, day)`, `mateBeat(step)` (step % 5 === 4), `mateBookLine(pairs, name)`, the ticker and memory
  strings, and `isPairs(raw)` (shared with the structure track).
- `game/src/social/cycle-193-courtship.test.ts`: the unit criteria for both tracks.
- `tests/e2e/cycle-193-courtship.spec.ts`: the e2e criteria for both tracks.

**Files to modify**
- `game/src/scenes/WorldScene.ts`: `pairs` + `courtedDay` fields; `courtBeat(a, b)` beside `faithWordBeat` in
  `converse`'s `finally`; `__court` / `__pairs` hooks in a `setupCourtship()` called beside `setupFaith()`; `mate`
  in the book row; the 💕 idle glyph after `faithful` in the glyph chain.
- `game/src/ui/lenses.ts`: optional `mate?: string` on the book row, rendered under `faith`.

**Reuse list:** `closestFriend` / `bondPoints` / `strengthen` (`social/bonds.ts`); `stageNow` (scene, `world/growth.ts`
`stageOf`); `remember`, `showBubble`, `logEvent`, `saveGame` (scene); the `faithWordBeat` placement pattern.

**New dependencies:** none.

**Test plan:** unit: courtship accept / decline / under-bar / young / already-paired; `courtGift` table + fallback;
`mateBookLine`. e2e: Mossback↔Glade pairs through `__forceConverse`, ticker + memories + book; second meeting no-op;
Ember→Sunny decline with `__bondPair` and the same-day lockout; Pip refused before the molt, accepted after.

**Risks:** the glyph chain is long; 💕 sits after the faith glyph so no shipped glyph beat gets rarer. `closestFriend`
must range over *every* live dino (not only the meeting's two), or every pair looks mutual.

## Structure track

**Item:** BACKLOG-620 — a pair keeps company.

**Files to modify**
- `game/src/world/saveGame.ts`: `pairs?: Pairs` on the save type; validate with `isPairs` (malformed → null); pass through.
- `game/src/scenes/WorldScene.ts`: write `pairs` in the save object, restore on load (`save.pairs ?? {}`); the idle
  wander branch leashes a mated adult with `tetherStep` after the guardian leash, when the mate is on the same ground and
  not migrating.

**Reuse list:** `tetherStep` (`world/growth.ts`), `zoneOf`, `this.migrating`, `isFaith`'s validation shape.

**Test plan:** unit: `isPairs` + a `validateSave` round-trip with good / bad / absent `pairs`. e2e: reload restores pairs;
the leash brings a separated pair within 3 tiles inside 20 steps and holds it for 20 more.

**Risks:** cross-track: both tracks edit `WorldScene.ts` and share `courtship.ts`. Build the lore track first. The leash
must come after `rand()` so unpaired dinos' streams do not move.

**Estimated touch count:** ~6 files.

## Shipped (coder)

Both tracks shipped as planned in 6 files (new: `social/courtship.ts`, its unit test, `cycle-193-courtship.spec.ts`; modified: `WorldScene.ts`, `saveGame.ts`, `ui/lenses.ts`). Build clean; unit 3430 green; the new spec 4/4. No blocker.
