# Cycle 175 — Design

The lore track closes Milestone 24 (*friendship has an opposite*); the structure track gives the last two bare
moments in the mark family a host, so tonight's Artist can draw the art queue's oldest item.

## Lore track — BACKLOG-397

**Item:** BACKLOG-397 [emergent] Reputation cows the bully.

**Why this cycle:** the last open arc of Milestone 24. Every other side of the hatch contest learns: the winner
reads its history with a gobbler (401), a beaten dino gives a feared one a berth on the approach (389), a victor
can show mercy (403). The bully alone does not. A gobbler stood up to at one drop shoulders into the same dino at
the next and is stood up to again — the only mind in the park that cannot learn from losing. On the bowl the three
prickly dinos (Rex 0.02, Glade 0.09, Mossback 0.22 agreeableness) are the gobblers, and Mossback (bravery 0.94) and
Glade (0.67) are bold enough to hold — so the first scramble where Rex shoulders at Mossback or Glade teaches Rex,
and the next one shows it.

**What ships:**
- `world/pecking.ts` (pure):
  - `cowedBy(memories, winner): boolean` — `peckingScore(memories, winner) <= -PECKING_BAR`. One slink-off (394,
    weight −2) is enough: a bully that has been stood up to by this dino once *has* been stood up to. Deliberately
    the score alone, without `PECKING_MIN_BEATS` — the item's own words are "stood up to … before".
  - `cowedGobble(winner, winnerHunger, candidates, memoriesOf)` → `{ gobbler: string | null; waited: string | null }`.
    The gobbler `gobblerAmong` would pick; if that dino is `cowedBy` the winner, it is the `waited` one and the
    gobbler is re-picked from the swarm without any cowed dino (another bully can still push in). Otherwise
    `waited` is null and the gobbler is exactly `gobblerAmong`'s — so a park with no hatch history is unchanged.
  - `WAIT_ART_KEY = 'wait'`, `WAIT_GLYPH = '⏳'`, `waitedLine(bully, winner)` →
    `⏳ <bully> waited its turn behind <winner> — <winner> has beaten it here before` (the tail is
    `becauseOf('wary', winner)`, reused, so the hatch never phrases one fact two ways).
- Scene (`checkFeeding`): the gobbler lookup goes through `cowedGobble`. When `waited` is set: `lastWait =
  { bully, winner }`, a ⏳ pops over the bully through `makeHourMark(WAIT_ART_KEY, WAIT_GLYPH)` for ~1.2 s (in view
  only — the standoff mark's shape), and the ticker logs `waitedLine`. **No memory filed** (the 389 berth rule: the
  ring the caution is read from must not be rolled by the caution). Then the contest proceeds with the re-picked
  gobbler or, if none, the winner eats.
- `WAIT_ART_KEY` added to `worldPlacedProps`.
- Hook: `__lastWait()` → `{ bully, winner } | null`.

**Acceptance criteria:**
- [ ] Unit: `cowedBy` is true after one `slunkOffMemory(winner)` in the ring, false with none, false for a different
      winner, false after a single yield (−1).
- [ ] Unit: `cowedGobble` with no history returns `{ gobbler: gobblerAmong(...), waited: null }` for the same inputs.
- [ ] Unit: with the top gobbler cowed and a second qualifying gobbler, `gobbler` is the second and `waited` the
      first; with no second, `gobbler` is null.
- [ ] Unit: `waitedLine` ends with `becauseOf('wary', winner)`.
- [ ] E2E (production `checkFeeding` path via `__dropFood` + `__stepWorld`): a bold winner stands against a gobbler
      (`__standFood` set); at the next drop with the same staging, `__lastWait()` names that gobbler and that winner,
      `__standFood()` and `__gobbleFood()` are null, the winner ate (its hunger fell), and the ticker carries `⏳`.
- [ ] E2E: a gobbler with no slink history still shoulders a timid winner (387 path unchanged).
- [ ] `WAIT_ART_KEY` is in `worldPlacedProps()` (unit).

**Out of scope:** the cowed bully filing a memory; standoff memories as pecking beats (noted for the Structure-smith);
a book line for "cowed by"; grudge changes from a wait.

**Constraints:** pure logic in `pecking.ts`; one branch in `checkFeeding`. Specs that drive two natural contests
between one pair (not via `__forceContest`) will now see the wait on the second — that is the feature; fix them
by staging, not by weakening it. Shares `WorldScene.ts` and `reachability.ts` with the structure track — different
methods, no ordering needed.

## Structure track — BACKLOG-571 (+ BACKLOG-557 rider)

**Item:** BACKLOG-571 [infra] The friend-found moment's host; rider BACKLOG-557 [infra] The cold mark's host.

**Why this cycle:** the friend-found moment shows only a speech bubble — nothing placed — so 568's sprig has sat
blocked since cycle 171, though the founding park makes the moment reachable in every fresh save (Twitch starts with
no friends). The cold funk's 🥶 is a literal `this.add.text` in `spawnDino`, so no rig can ever replace it. Both are
the `mope`/`sulk`/`comfort` shape and nothing more.

**What ships:**
- `world/loner.ts`: `FRIEND_FOUND_ART_KEY = 'friend_found'` beside `FOUND_FRIEND_GLYPH`.
- Scene: `checkLonerLift` also calls `popFriendFoundMark(d)` — `makeHourMark(FRIEND_FOUND_ART_KEY, FOUND_FRIEND_GLYPH)`
  over the dino for ~1.2 s, in view only (the `popComfortMark` shape), and bumps a `friendFoundPops` counter.
  Hook `__friendFoundPops()`.
- `world/cold.ts`: `COLD_ART_KEY = 'cold'`, `COLD_GLYPH = '🥶'`. `spawnDino` pushes `coldMarks` through
  `makeHourMark(COLD_ART_KEY, COLD_GLYPH)`; `coldMarks` typed `Array<Text | Image>`. `refreshColdMarks` unchanged.
- Both keys added to `worldPlacedProps`.

**Acceptance criteria:**
- [ ] Unit: `FRIEND_FOUND_ART_KEY` and `COLD_ART_KEY` are in `worldPlacedProps()`.
- [ ] E2E: on a fresh save, raising Twitch's bond with an in-view bowl dino over `LONER_FLOOR` through a production
      meet path fires the lift — `__friendFoundPops()` goes 0 → 1 and Twitch's memory has the found-a-friend line;
      a second lift does not pop again (one-shot preserved).
- [ ] E2E: the cold mark still shows for a cold-pending dino (`cold` in the per-dino mark family report) — the
      existing cold spec(s) stay green.
- [ ] No `this.add.text(0, 0, '🥶'` literal left in `WorldScene.ts` (grep).

**Out of scope:** drawing either rig (the Artist's); 563 / 573.

**Constraints:** `makeHourMark` falls back to the glyph while `hasPropArt` is false, so the cold mark renders as
before until a rig lands.
