# Cycle 164 — Design

Two tracks. Neither is under rework; both verdicts last cycle were APPROVED.

---

## Lore track — BACKLOG-157

**Item:** BACKLOG-157 [emergent] More keeper abilities — *the second one.* Milestone 21's third
lore arc: "A second distinct keeper ability that is a genuine read on your choice, not a number."

**Why this cycle.** Four observers are selectable and exactly one of them can *do* anything. Field
Scan shipped at cycle 38 and has been the roster's only power for 126 cycles, which means three of
the four seats are still pure affinity arithmetic — a number the player never sees. The item's own
note rules out the obvious second candidate (the bond graph is already public to every keeper via
the `V` lens) and points at a sky-nudge for VANTA-9. **We are taking AETHER-1 instead**, and the
reason is CHARTER v7's bar rather than taste: the flare's payoff is gated on a clear night, a fresh
save opens at hour 8, and at `ACTIVE_SCALE = 60` dusk is roughly twelve real minutes out — past the
ten-minute reachability window. The diplomat's power is live at second zero, because five founding
dinos are standing in the bowl the moment the game boots.

And the spec was written 126 cycles ago by accident. AETHER-1's *refusal* for Field Scan reads:
**"A diplomat does not pry into a mind. I read the room, not the soul."** That sentence has sat in
`keeper/scan.ts` as a consolation prize. Make it the ability. Lux reads one mind and it is a
spoiler; Aki reads the whole floor and it is a map of the party — a different *kind* of knowledge,
not a second helping of the same kind, which is what "a genuine read on your choice" has to mean.

**What ships.**

Press **R**. If you are AETHER-1, a panel opens in the scan panel's idiom listing, for the ground
you are standing on:

- every pair of dinos **standing near each other** (Chebyshev <= 2 tiles, same zone), each tagged
  with how that pair is getting on — `at ease` when their bond clears the ease floor, `edgy` when
  it does not;
- every dino **nobody is standing near**, named;
- a closing read when the room is uniform: everyone has somebody, or nobody has anybody.

Press **R** again to close it. If you are VANTA-9, LUMEN-3 or Kes, you get an in-character refusal
instead — a fading bubble over the nearest dino, exactly as Field Scan does, or a ticker line when
you are not near anyone. The refusals are the half of Field Scan that actually made the roster feel
chosen, so all three are written, not defaulted.

On a fresh save the panel says something true and interesting immediately: the founding cast has
zero bonds, so a brand-new park reads as a room full of strangers standing in twos and threes and
`edgy` about it — which is the correct first impression of a park nobody has kept yet, and it will
visibly change as the bowl warms up.

**Acceptance criteria**
- [ ] A new pure module `game/src/keeper/room.ts` exports `canReadRoom(keeper)`, `roomLines(...)`
      and `roomRefusal(keeper)`, imports no Phaser and no `@mlc-ai/web-llm`, and is unit-tested.
- [ ] `canReadRoom` is true for `aether` only; false for `vanta`, `lumen` and `kestrel`.
- [ ] `roomRefusal` returns a **distinct, non-empty** in-character string for each of `vanta`,
      `lumen` and `kestrel`, and the empty string for `aether`.
- [ ] Pressing `R` as AETHER-1 makes the room panel visible; pressing `R` again hides it.
- [ ] Pressing `R` as any other observer leaves the room panel hidden and surfaces that observer's
      refusal text (bubble when a dino is in range, ticker line otherwise).
- [ ] `roomLines` pairs two dinos when they are within 2 tiles (Chebyshev) **on the same zone**, and
      does not pair two dinos on different zones at identical tile coordinates.
- [ ] A pair whose bond is at or above the ease floor reads `at ease`; a pair below it reads `edgy`.
- [ ] A dino with nobody within 2 tiles on its own zone is listed as standing alone, by name.
- [ ] Output is deterministic: the same input produces byte-identical lines, with pairs and lone
      dinos in alphabetical order.
- [ ] `roomLines` over an empty cast returns a header and nothing that reads as a false claim.
- [ ] On a fresh save with the founding roster, pressing `R` as AETHER-1 produces a panel with at
      least one line beyond the header (the CHARTER v7 reachability check).
- [ ] The `R` binding does not set `dialogOpen` and does not eat the next `E` press.
- [ ] e2e covers: `R` as Aki opens the panel; `R` as Vix does not and produces Vix's refusal.

**Out of scope**
- VANTA-9's sky flare — stays queued under 157 as the third ability; it wants a cycle that can also
  hand it a reachable night.
- Kes's ability — 157 is explicitly one ability per cycle.
- Any LLM colouring of the readout. This is deterministic, like Field Scan.
- Any touch-sheet row. The More sheet is at its geometric ceiling (BACKLOG-552) and adding an
  eleventh row is that item's job, not this one's. Note it in the verdict rather than forcing it.

**Constraints**
- Mirror `keeper/scan.ts` in shape and discipline: `canX` / `xLines` / `xRefusal`, pure,
  Node-testable, `WorldScene` only paints.
- The refusal must **not** be a dialog — never set `dialogOpen`, or it eats the next `E` press. This
  is the trap `toggleScan` documents; do not re-fall into it.
- `R` is free (used keys: B C E F G H K M O P T V Z, brackets, comma, period, 1-4, WASD, arrows).
- Reuse rather than re-derive the adjacency geometry: `skyEvent.ts`'s `stargazingPairs` already
  computes same-zone Chebyshev-adjacent pairs and already carries the zone fix. Give it an optional
  `radius` parameter (default 1, so every existing caller is byte-identical) and call it from
  `room.ts`. Do not write a second pair-finder.

**Rider on this track (BACKLOG-556's host, cycle-154 / BACKLOG-530 precedent).**
The Lore-smith seeded tonight's art item with its host scheduled to this Coder. Four lines, in
`WorldScene.ts` + `world/loner.ts` + `world/reachability.ts`:
- export `MOPE_ART_KEY = 'mope'` from `world/loner.ts`;
- widen `mopeMarks` to `(Phaser.GameObjects.Text | Phaser.GameObjects.Image)[]`;
- build it with `this.makeHourMark(MOPE_ART_KEY, MOPE_GLYPH)` instead of `this.add.text(...)`;
- add `MOPE_ART_KEY` to `worldPlacedProps()` in `world/reachability.ts`.

`refreshMopeMarks` sets no text (the glyph is set at construction), so unlike the need tells this
needs **no** two-key swap and no refresh change. The mark must still render as the wilt glyph while
no rig exists — `makeHourMark` already falls back to `Text` when `hasPropArt` is false, which is
what keeps the build green tonight and lets the Artist light it up later in the same cycle.

---

## Structure track — BACKLOG-555

**Item:** BACKLOG-555 [core] The watcher's record, not just its id. Milestone 21's only unchecked
structure arc.

**Why this cycle.** `saveGame.ts` persists one fact about the observer — `keeperId?: string`. That
was right for BACKLOG-155, which only had to remember the pick, and it is now the single reason two
queued keeper items cannot be started. BACKLOG-156 wants an authored keeper persona under the
CHARTER's generate-once/cache/persist rule and has no field to cache it in, so today it would be
re-authored every boot — the exact failure "Living minds" exists to forbid. BACKLOG-162 wants the
bowl to notice the watcher *changing* and there is no previous id, no switch count and no timestamp,
so "the watcher changed" is not derivable from the save at all. Ship the record and both unlock.

**What ships.**

A `keeper` record beside `keeperId` in the save, and one line of brass that reads it.

New pure module `game/src/keeper/record.ts`:
- `KeeperRecord { id; sinceDay; switches; previousId?; persona? }` — `persona` is 156's slot, typed
  `{ text: string; source: string }` to match the dino `personas` shape already in the save, so 156
  needs no second migration.
- `newRecord(id, day)` — a fresh record, `switches: 0`, no `previousId`.
- `switchTo(rec, id, day)` — bumps `switches`, moves the old id to `previousId`, resets `sinceDay`,
  and **drops `persona`**: a cached persona belongs to the observer that was authored, not to the
  seat. Getting this wrong would hand 156 a bug on its first night.
- `recordFrom(saved, keeperId, day)` — the additive load seed. A save with a full record returns it;
  a save with a bare `keeperId` and no record returns `newRecord(keeperId, day)`; a save with
  neither returns `newRecord(DEFAULT_KEEPER_ID, day)`. No throw, no migration step.
- `watchLine(rec, keeper, day)` — the brass line.

Save: `keeper?: KeeperRecord`, strictly additive and validated in the `personas` idiom (reject only
if malformed; absent is legal and means an older save).

Plaque: a new optional `watch?: string` in `PlaqueStats` rendering `Watch · <line>` — absent means
nothing, so every existing plaque literal in the suite is byte-identical.

Wiring: choosing an observer at the `K` picker calls `switchTo` when the id actually changes and
leaves the record alone when you re-pick the one you are already wearing (re-picking yourself is not
a switch, and 162 will read this count).

**Reachability (this is the item, not a rider on it).** On a fresh save the brass reads
`Watch · AETHER-1 "Aki" · since day 1`. Switch to Vix on day 3 and it reads
`Watch · VANTA-9 "Vix" · since day 3 · 2nd watcher`. That is a true statement about a brand-new
park, visible in the first ten minutes, and it is the line that stops this being groundwork.

**Acceptance criteria**
- [ ] `game/src/keeper/record.ts` is pure (no Phaser, no `@mlc-ai/web-llm`) and unit-tested.
- [ ] `newRecord(id, day)` returns `switches: 0`, `sinceDay: day`, `id`, and no `previousId`.
- [ ] `switchTo` increments `switches`, sets `previousId` to the outgoing id, sets `sinceDay` to the
      given day, and returns a record with **no** `persona` even when the input had one.
- [ ] `recordFrom` seeds from a bare `keeperId` when no record is saved, and from `DEFAULT_KEEPER_ID`
      when neither is saved.
- [ ] A current-shape save round-trips a full `keeper` record unchanged (save -> load -> deep equal).
- [ ] A save file **without** a `keeper` key loads successfully and yields a seeded record — the
      additive-save rule, tested against an old-shaped fixture.
- [ ] A save whose `keeper` value is malformed (wrong types) is rejected by the parser, not silently
      coerced — matching how `personas` and `metWatcher` behave.
- [ ] `plaqueLines` with no `watch` returns byte-identical output to today's for the same stats.
- [ ] `plaqueLines` with `watch` set renders exactly one additional `Watch · …` line.
- [ ] On a fresh save the plaque shows a `Watch · ` line naming the current observer and `since day 1`.
- [ ] Picking the observer you are already wearing at the `K` picker does **not** increment `switches`.
- [ ] Picking a different observer increments `switches` by exactly 1 and sets `previousId`.
- [ ] e2e: a fresh boot shows the `Watch · ` line on the plaque; switching at `K` changes it.

**Out of scope**
- Authoring the persona (BACKLOG-156). This ships the **slot**, empty, and nothing that fills it.
- Any dino-facing reaction to a switch (BACKLOG-162). This ships the **record**, and nothing that
  reads it except the brass.
- The observer dossier page in the book (BACKLOG-163).
- Any save version bump. This is additive; a bump would be the wrong tool and would break old saves.

**Constraints**
- **Strictly additive.** An old save must load. This is the point of the item, not a limit on it.
- Keep `saveGame.ts` free of a `keeper/` import — the file's existing discipline is that keeper ids
  are plain strings there (see the `metWatcher` comment). The record's *validation* lives in
  `saveGame.ts` as a shape check; its *semantics* live in `keeper/record.ts`.
- `PlaqueStats.watch` must be optional and absent-means-nothing, the `bookLines(rows, away = [])`
  precedent from cycle 153.

---

## File overlap between the tracks — sequence, do not interleave

Shared directory: `game/src/keeper/` — but **no shared file**: the lore track adds `room.ts`, the
structure track adds `record.ts`.

Shared file: `game/src/scenes/WorldScene.ts`, in different regions —
- lore track: a key binding in the `create()` key block, a `setupRoom()` + `toggleRoom()` pair near
  `setupScan`/`toggleScan`, and the mope-mark rider at the mark-construction site;
- structure track: the save/load path, the `K` picker's commit, and `plaqueStats()`.

**Build the structure track first.** Its edits are to load-bearing paths (save parse, picker commit,
plaque) and the lore track's are additive leaves; taking the load-bearing one first means the second
set of edits lands on a tree that is already green rather than the other way round.
