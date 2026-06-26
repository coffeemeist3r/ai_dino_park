# Cycle 81 — Design

Two tracks, file-disjoint. Lore = the loner's payoff (369); Structure = directed carry (356).

## Lore track — BACKLOG-369 (The loner finds a friend)

**Item:** BACKLOG-369 [emergent] — when a dino that had been a loner (135) grows its first bond above the
floor, it files a quiet "not so alone now" beat and the 🥀 lifts.

**Why this cycle:** Cycle 80 shipped the loner (135): a dino whose every bond sits below `LONER_FLOOR=8`
withdraws to the wall and wears a 🥀, and a keeper greet lands extra-hard on it. The Validator flagged the
deliberate restraint — the mope-drift is probabilistic so a loner still mills enough to *meet* someone and
grow out of it — but nothing yet *marks* that growing-out. The 🥀 already lifts on its own (it reads the
live bond graph, so the moment `isLoner` flips false the mark stops drawing), but the transition passes
silently. This adds the beat: the first time a loner crosses the floor into friendship, it's a moment.
Loneliness becomes a state a dino visibly *leaves*, not a label.

**What ships:** Watch (or drive) a loner — on a fresh bowl every dino is one — grow a bond with a peer past
8 points (by meeting, or via the `__bondPair` dev hook). The instant that bond clears the floor: a 🌱
perk-up bubble floats over the dino, and a "found a friend — not so alone now" entry lands in its memory
(readable in murmurs / `__memory`). Its 🥀 stops showing (already true off the live graph). It fires **once
ever** per dino — a dino that dips back below the floor and climbs again doesn't repeat the beat.

**Acceptance criteria:**
- [ ] On a fresh bowl, `__isLoner('Rex')` is `true` before any bonding (all bonds below the floor).
- [ ] After `__bondPair('Rex', <peer>, 10)` pushes Rex's strongest bond to ≥ `LONER_FLOOR` (8), `__isLoner('Rex')` is `false`.
- [ ] That same transition files exactly one memory entry in `__memory()['Rex']` containing the loner-friend text (the "not so alone" phrasing).
- [ ] The beat is one-shot: bonding Rex with a *second* peer above the floor adds no further loner-friend memory entry (count stays 1).
- [ ] A dino bonded above the floor from the start (never a loner) gets **no** loner-friend memory when its bond rises further.
- [ ] `loner.ts` stays pure (no Phaser / no WebLLM import); the loner-friend memory + line are pure functions.
- [ ] No save-format change: the once-fired guard is transient (the memory itself is the persistent record); old saves load unchanged, no `SAVE_VERSION` bump.

**Out of scope:** Lonely-lean-on-keeper (370, separate item); any change to the 🥀 drift/mark logic or the
`LONER_FLOOR`/`LONER_BONUS` constants; LLM-coloured prose (the memory line is deterministic). No change to
how bonds strengthen.

**Constraints:** Touches `world/loner.ts` (new pure helpers) + `WorldScene` at the meet-site bond bump
(~line 2015) and the `__bondPair` hook (~line 1289), plus a transient `Set` field + memory/`showBubble`
glue. **No file overlap** with the structure track (resource.ts / `crossDino`). Must not regress the
cycle-080 loner specs (the 🥀 tell, the `LONER_BONUS` greet) — this only *adds* the lift beat.

## Structure track — BACKLOG-356 (Directed carry)

**Item:** BACKLOG-356 [emergent] — a crossing dino ferries the kind the destination zone is *short of* for
its next craft, instead of a random/most-stocked spare, so carry actively balances the two economies.

**Why this cycle:** The zone economy is nearly a loop: zones gather different mixes (348), bank separate
piles (328), and a crosser ferries one resource home→dest (329). But `pickCarry` moves the *most-stocked*
kind in the source — a random spare, blind to what the destination actually needs. Once the zones diverge
(the grove swimming in branches, the bowl in stone), the destination is often short of exactly the kind the
source has spare, yet today's carry won't prefer it. Directed carry closes the loop: the crosser brings
what the destination needs for its *next craft* (the cairn recipe `{branch:3, stone:2}`), so the trade
route pulls both piles toward buildable instead of shuffling at random.

**What ships:** A dino crossing into a zone short of a craft ingredient ferries *that* ingredient when its
home pile has it, in preference to a more-plentiful spare. Concretely: bowl pile `{stone:2, branch:1}`
(stone is most-stocked), grove pile empty (needs `branch:3, stone:2` for its next cairn — branch is the
larger shortfall). A dino crossing bowl→grove now carries the **branch** (the kind the grove is shortest
of), where the old carry would have moved the stone. When the destination has no craft shortfall the source
can fill, it falls back to today's `pickCarry` behavior (a spare still moves — carry stays lossless and
never a no-op when something *can* move).

**Acceptance criteria:**
- [ ] `directedCarry(src, dest)` returns the recipe kind with the largest shortfall in `dest` that `src` has (>0) and `dest` can accept (not at cap). For `src={stone:2,branch:1}`, `dest={}`: returns `'branch'` (deficit 3 > stone's 2).
- [ ] When `dest` is fully stocked for the next craft (no positive shortfall the source can fill), `directedCarry` returns the same as `pickCarry(src, dest)` (spare-ferry fallback).
- [ ] `directedCarry` respects the destination cap: a kind `dest` is at `STOCKPILE_CAP` for is never chosen even if `dest`'s recipe wants it.
- [ ] An empty source returns `null` (nothing to carry), exactly as `pickCarry` does.
- [ ] Tie on shortfall is deterministic — `RESOURCE_GLYPH` order (branch before stone).
- [ ] E2E: bowl pile `{stone:2, branch:1}`, grove empty; a dino crosses bowl→grove and the grove pile gains a **branch** (not stone); the transfer is conserved (bowl branch −1).
- [ ] Carry stays conserved/lossless overall: `crossDino` still uses `takeResource`/`bankResource`, so source −1 / dest +1; no resource created or destroyed.

**Out of scope:** Shelter-recipe-aware targeting (the cairn recipe is the canonical "next craft" — the
cairn auto-crafts every gather, so it's always the live target; shelter targeting can follow); the both-zone
readout (357); barter (358); zone-distinct craft (377). No save change.

**Constraints:** Touches `world/resource.ts` (new pure `directedCarry`, reusing `atCap`/`CRAFT_RECIPE`/
`RESOURCE_GLYPH`/`pickCarry`) + the single `pickCarry` call-site in `WorldScene.crossDino` (~line 3033).
**No file overlap** with the lore track. Must not regress the cycle-077 carry spec (conservation, empty
source carries nothing) — directed carry is a strictly smarter *choice* of kind on the same transfer path.
