# Cycle 133 — Design

Two tracks, Milestone 14 arc 2 on each.

---

## Lore track — BACKLOG-407

**Item:** BACKLOG-407 [emergent] Shared tic — a dino that watches a close friend perform its solitary tic
(405) enough times picks up a faint echo of it, so a personal ritual can *spread* between friends.

**Why this cycle**

The tic has been the park's most private beat since cycle 88: a dino alone long enough invents a small
ritual keyed to its most-pronounced trait, and that ritual has never left the dino performing it. Cycle 132
gave it a *cause* (a sting at the hatch starts it sooner); this gives it a *route*. It is also the first
behaviour in this park's life to travel sideways between two living dinos — every other trait is seeded at
birth (010), blended at a hatch (042), or self-nudged within a capped band (043/187). Milestone 14's headline
verb is *spreads*, and this is the item that earns it.

**What ships**

- Every dino keeps a per-pair count of how many times it has **watched** a particular friend fall into its
  ritual. A watch is counted at the moment the performer's ritual forms (the first float of a solitary
  stretch, `performTic`'s invention branch), for every same-zone dino that is:
  - **in the watching band** — strictly further than `TIC_COMPANY_RANGE` (3) tiles and within
    `ECHO_WATCH_RANGE` (8) tiles, Chebyshev, the same metric `companyNear` uses. The band is the design: a
    tic only forms when nobody is *company*, so the watcher is by construction near enough to see and far
    enough not to have broken the ritual. A friend that walks over gets no watch that stretch.
  - **a close friend** — pairwise bond ≥ `ECHO_BOND_FLOOR` (8, the same `GRIEF_BOND_FLOOR` the ache and the
    comfort visit already use). A stranger across the clearing learns nothing.
  - not already carrying an echo (a dino picks up one friend's ritual, not a chain of them).
- At `ECHO_WATCHES_NEEDED` (3) watches of the *same* friend, the watcher **picks the ritual up**: from then
  on its own tic is the friend's tic rather than its own signature one, floated with the friend's glyph and
  described with an echoed label. It files a one-time memory naming the friend and the ritual, floats the
  adopted glyph, and posts a ticker line so the player can catch the moment it takes.
- The echo is **faint, not a rewrite**: it changes which ritual the dino performs and nothing else. Its
  personality is untouched, its `signatureTic` still answers what it was born with, and everything layered
  over the tic since (the sting onset 412, the grief edge 414, the caught-mid-ritual openers 408/413, the
  pacing trace 424) reads the adopted ritual through the same `Tic` value it always read, with no branch.
- Persisted additively: the per-pair watch counts and the adopted ritual survive a reload, because a ritual
  you learned from a friend is exactly the kind of fact a save is for.

**Acceptance criteria**

- [ ] `watchingTic(dist)` is false at distance ≤ 3 (company range), true at 4..8, false at 9+.
- [ ] `picksUpTic(watches, bond)` is true only when `watches >= 3` **and** `bond >= 8`; a bond of 7 at 5
      watches is false, and a bond of 20 at 2 watches is false.
- [ ] `signatureAxis(p)` returns the axis furthest from 0.5 (ties by AXES order) and `signatureTic(p)` is
      exactly `TIC_BY_AXIS[signatureAxis(p)]` — the pre-407 answer for every personality.
- [ ] `echoedTic(t)` keeps the source tic's `kind` and `glyph` and returns a label that differs from `t.label`
      (so the ritual reads as borrowed, not native).
- [ ] `echoTicMemory(label, friend)` names both the friend and the ritual.
- [ ] Dev hook: with two same-zone dinos, a bond ≥ 8 between them, and one driven through three tic
      inventions with the other parked 5 tiles away, `__ticEcho(watcher)` reports the performer's ritual and
      `__ticWatches(watcher, performer)` reports 3.
- [ ] The same three inventions with the watcher parked 2 tiles away (inside company range, which also
      suppresses the tic) or 12 tiles away leave `__ticEcho(watcher)` null.
- [ ] The same three inventions with the pair's bond below 8 leave `__ticEcho(watcher)` null.
- [ ] Once the echo lands, the watcher's own ticcing floats the **performer's** glyph, and its memory ring
      carries the echo memory naming the performer.
- [ ] A dino that already carries an echo does not acquire a second one from a different friend.
- [ ] Save/reload: the adopted ritual and the watch counts survive a round-trip; a save written before this
      cycle (no such fields) restores with every dino on its own signature tic and no errors.
- [ ] e2e: a driven scenario shows a watcher picking up a friend's ritual — the ticker line appears and the
      watcher's subsequent tic glyph matches the friend's.

**Out of scope**

- The collection book line (that is arc 3, BACKLOG-409 — it will read `ticFor` and get the echo for free).
- Any change to how a tic *forms* (onset thresholds 405/393/410/412 are untouched).
- Un-learning an echo, echoes of echoes, or a chain of imitation. One hop, permanent, one per dino.
- Any bond change: watching a friend's ritual does not warm the pair. The mimicry *is* the bond reading, not
  a new source of it.

**Constraints**

- Pure logic in `game/src/world/tic.ts`; Phaser glue stays in `WorldScene`. No WebLLM anywhere near it.
- Additive save only — absent fields restore to today's behaviour exactly.
- The three existing `signatureTic(...)` call sites in `WorldScene` (the dev hook, the ambient tic step, and
  the scan/keeper read at ~L5847) must all go through one new `ticFor(dino)` helper, so no reader can ever
  see a dino's native ritual where the player sees its adopted one.
- File overlap with the structure track: none. 407 touches `world/tic.ts` + the ambient-step block; 485
  touches `world/governance.ts` + `workPriorityFor`. Both touch the save block and the dev-hook block of
  `WorldScene` — sequence 407 first, then 485, so the two save fields land in separate hunks.

---

## Structure track — BACKLOG-485

**Item:** BACKLOG-485 [core] The bill reaches the call — a zone carrying a derelict landmark biases its own
work call toward `'gather'` while anything of its is in disrepair.

**Why this cycle**

480 gave the skyline a running cost and a reversible disrepair; 481 handed the ground's work call to its
council; 484 gave that council a term. None of them can hear each other. A ground whose landmarks are
falling down sets its labour policy off its seats' temperaments alone, exactly as a thriving one does — and
if those seats are energetic, it answers a collapsing skyline by resolving to raise *more* walls. This is the
first feedback loop in the park from a building back into a decision: the ground answers its own emergency.

**What ships**

- A pure modifier in `world/governance.ts`:
  - `billLean(derelict)` → `'gather'` when a ground carries one or more derelict landmarks, else `null`.
  - `calledWork(voted, derelict)` → the lean when there is one, else the voted/provider call unchanged.
    `calledWork(x, 0) === x` for every input including `null` — the compatibility seam.
- `workPriorityFor(zone)` returns `calledWork(<today's answer>, derelictIn(zone))`. The lean is applied
  **after** the stored decision, never instead of it: `workPriorityByZone` keeps recording what the council
  or provider actually decided, so a ground that patches its skyline up returns to its own call rather than
  being stuck on the emergency footing. The lean is a *lean*, not a new decision, and it is therefore not
  persisted.
- All three work-call hooks read the leaned answer with no edits of their own, because they read
  `workPriorityFor`: the bias-landmark defer (`landmarkDeferredForGathering` — a ground with something
  derelict stops spending its pile on new cairns below the floor), the granary gate (`granaryGateFor` — it
  loses the build-first shortcut), and the regrowth multiplier (`workRegrowth` — the worked ground recovers
  faster). That is the loop closing: the ground stops building and starts gathering, which fills the pile,
  which pays the upkeep, which patches the landmark, which releases the lean.
- The turnover beat announces it. `checkCouncilCall` currently skips a zone with no seated council; it now
  also runs for a zone carrying disrepair, and when the lean is what decided the call it posts a distinct
  line naming the reason (the 🛠️ upkeep mark, not the 🗳️ vote mark) rather than announcing a vote nobody held.
- The lens is unchanged by design — 🧺 already means "fills its stores first", and a ground leaning that way
  because its walls are falling is telling the truth in the legend's own words. The `[?]` legend gains no row.

**Acceptance criteria**

- [ ] `billLean(0)` is null; `billLean(1)` and `billLean(3)` are `'gather'`.
- [ ] `calledWork(p, 0) === p` for `p` in `'gather' | 'build' | null` (the bit-identical seam).
- [ ] `calledWork('build', 1) === 'gather'`; `calledWork(null, 1) === 'gather'` — a ground that has decided
      nothing still answers its own disrepair.
- [ ] Dev hook: a zone with a `build` council call and one landmark forced derelict reports
      `__workPriority(zone) === 'gather'`; with the landmark patched back up it reports `'build'` again.
- [ ] The stored decision is not overwritten: after the lean has applied and the disrepair is cleared, the
      zone's call is the council's own answer, not `'gather'`.
- [ ] `workRegrowth` for that zone uses the gather multiplier while the disrepair stands (the yield recovers
      at `GATHER_REGROW_MULT`, verifiable through the existing regrow path).
- [ ] `landmarkDeferredForGathering` is true for that zone below `WORK_BUILD_FLOOR` while derelict — a ground
      with a falling-down skyline does not spend its thin pile on a new cairn.
- [ ] A park with nothing derelict is bit-identical: every existing governance/regrowth/lens spec passes
      unamended, and a fresh save's lens row is unchanged.
- [ ] The ticker posts the disrepair-driven line (🛠️) when the lean flips a ground's call, and the ordinary
      vote line (🗳️) when a council flip does it — never the vote line for a lean.
- [ ] Save format unchanged (the lean adds no persisted field); an old save restores identically.
- [ ] e2e: forcing a landmark derelict in a zone via the existing `__runUpkeep` / landmark dev hooks flips
      `__workPriority` for that zone to `'gather'` and posts the 🛠️ line.

**Out of scope**

- The spend call (463/487) — it stays the provider's this cycle; that is the milestone's next structure arc.
- Any dino *performing* a repair (seeded this cycle as BACKLOG-488).
- Changing upkeep arithmetic, `STRUCTURES_PER_UPKEEP`, or `REPAIR_COST`.
- A lens glyph or legend row for the lean.

**Constraints**

- Pure logic in `world/governance.ts` beside the call it modifies; no new module (the item asks for one
  modifier, and a second file would be this one with a different name).
- `null`-safe throughout: a park with nothing derelict must be bit-identical, and the QA evidence for that is
  the existing suite passing **unamended**.
- The lean must not be written into `workPriorityByZone` — QA should check the stored value directly, not
  only the returned one.
- No change to the save envelope version.
