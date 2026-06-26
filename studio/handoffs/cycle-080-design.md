# Cycle 80 — Design (two tracks)

## Lore track — BACKLOG-135 (The loner)

**Item:** BACKLOG-135 [emergent] The loner — a dino whose every dino↔dino bond sits below a floor
withdraws to the bowl edge and mopes (🥀); poor social integration becomes a visible personality tell,
and a keeper greet lands extra-hard on the one who needs it most.

**Why this cycle:** The dino↔dino bond graph (013) drives huddles, comfort, gossip — but it has never
said anything about a dino with *no* close ties. Every distinctness beat so far has been about pairs and
clusters; this is the first about the dino on the outside. It reads state that already exists
(`maxBond`) and turns it into a poignant, legible tell, and it makes keeper attention matter most where
it's most needed. Clean of the structure track (it touches the wander-decision branch + greet gain,
not the forceStep tail / needs / pond).

**What ships:**
- A dino whose strongest pairwise bond is below `LONER_FLOOR` is a **loner**. While it is one (and not
  huddling / gathering / responding / migrating / in a sky event), it drifts toward the nearest bowl
  edge instead of toward the cluster, and wears a floating **🥀** mark above it (the cold-mark
  convention — gated on `inView`).
- Greeting (E/Z) or toning a loner gives an **outsized** affinity bump (a normal greet/tone gain plus a
  loner bonus) and floats a one-shot **💐 perks up** beat — the lonely dino is extra-responsive to the
  keeper's notice. (The 🥀 itself reflects the bond graph, so it persists until the dino actually forms
  a bond — that payoff is the seeded follow-up 369.)
- A dino with any bond at/above the floor is **not** a loner: no 🥀, no edge-drift, normal greet gain.

**Acceptance criteria:**
- [ ] A dino whose every pairwise bond < `LONER_FLOOR` reports as a loner (`__loners()` includes it).
- [ ] A dino with at least one bond ≥ `LONER_FLOOR` is not a loner (`__loners()` excludes it).
- [ ] A loner's 🥀 mark is visible (in-view) above it; a non-loner shows none.
- [ ] Over several `forceStep`s with no competing override, a loner's distance to the nearest bowl edge
      does not increase (it heads for / sits at the edge), while a clustered non-loner is free to roam.
- [ ] Greeting a loner raises its friendship by **more** than greeting an identical non-loner would
      (the loner bonus is applied), and floats the 💐 perk-up beat once.
- [ ] Greeting a non-loner is byte-identical to today (no bonus, no 💐).
- [ ] Pure `world/loner.ts` has no Phaser/WebLLM import; the loner read is a pure function of bonds.

**Out of scope:** The 🥀 lifting when a loner makes a friend (369). The loner leaning toward the *keeper*
specifically vs a random edge (370). Any LLM dialogue colour. Loner status across zones (the grove cast
is small; compute over the dino's own zone peers is fine but not required — bowl is the demo).

**Constraints:** Must not change greet/tone gain for non-loners (cycle-006/035 sentries). Must not
disturb the existing forceStep override priority (inspection > response > migration > arrival > food >
huddle > gather). The mope branch sits **below** huddle/gather and **above** socializing. Reuse
`maxBond`, `greetGain`, the `coldMarks` mark pattern. No save change (loner status is derived from the
already-saved bond graph — nothing new to persist).

---

## Structure track — BACKLOG-371 (Need-drive spine)

**Item:** BACKLOG-371 [core] Need-drive spine — hunger + thirst as trait-shaped values (0..1) that build
over realtime and resolve through existing actions (eat at the hatch → hunger 0; reach pond water →
thirst 0), surfaced as a gentle 🍖/💧 tell. No death, no spiral, no wander-pull.

**Why this cycle:** The structural answer to the operator's hunger/thirst nudge, split deathless per
IDEABOX. A dino has never wanted anything on its own clock; this is the foundation the food web (367)
and hunger-voice (368) stand on, and the deathless state the operator can feel out before ruling on
mortality. Minimal on purpose — values + a tell + resolution through actions that already exist.

**What ships:**
- Each dino carries a **hunger** and a **thirst** value in [0,1], starting at 0, advancing every
  `forceStep` at a **trait-shaped** rate (a higher-energy dino hungers a little faster). Pure math in
  `world/needs.ts`.
- When a value crosses `NEED_THRESHOLD`, the dino is **in want**, and the more pressing need shows a
  floating **🍖** (hunger) or **💧** (thirst) mark above it (cold-mark convention; gated on `inView`).
- **Resolution through existing actions, no new pull:** when a dino eats at the hatch (`eatFood`), its
  hunger resets to 0; when a dino is within pond-water sight (`nearPond`, reused from arrival.ts/359),
  its thirst resets to 0 (it drinks). The mark clears with the need.
- Needs **persist additively** in the save (`needs` map; old saves → all dinos start at 0, no
  `SAVE_VERSION` bump).

**Acceptance criteria:**
- [ ] A fresh dino has hunger 0 / thirst 0; after N `__advanceNeeds()` steps both have risen (clamped ≤ 1).
- [ ] `pressingNeed` returns `'hunger'`/`'thirst'`/`null` correctly: null below threshold, else the larger.
- [ ] A higher-energy dino's hunger rises faster than a lower-energy dino's over the same steps.
- [ ] A dino over the hunger threshold shows a 🍖 mark in-view; over thirst shows 💧; below both shows none.
- [ ] Feeding a hungry dino at the hatch resets its hunger to 0 and clears its 🍖 mark.
- [ ] A thirsty dino reaching pond-water sight resets its thirst to 0 and clears its 💧 mark.
- [ ] `needs` round-trips through save/load; a save with no `needs` field loads to all-zero (no crash).
- [ ] **No death:** a need pinned at 1.0 over many steps never removes a dino or changes population.
- [ ] Pure `world/needs.ts` has no Phaser/WebLLM import.

**Out of scope:** Any **wander-pull** toward food/water (that's the seeded 372 follow-up — a need is a
*tell* this cycle, not a behavior driver). Death / decay-to-death (CHARTER-level, routed to operator).
Hunting (367), hunger-in-voice (368). Thirst from anything but the pond (no water troughs). Per-need
HUD/plaque readout (the marks are the readout).

**Constraints:** Must not add a wander branch (keeps it disjoint from the lore track's mope branch — the
two tracks share `forceStep` but in different regions: needs in the tail via a `checkNeeds()` call +
the `eatFood` reset; loner in the wander-decision block + a 🥀 mark). The 🍖/💧 and 🥀 marks are
separate index-aligned `Text[]` arrays — a dino could in principle be both a loner *and* hungry, and
both marks should be allowed to show (stack them at different y-offsets, like 💤/🥶 already do). No
`@mlc-ai/web-llm` import outside `game/src/ai/`.

**Cross-track file overlap (Coder, sequence-aware):** both tracks touch `WorldScene.ts` (`forceStep`,
`spawnDino`, the mark-refresh region, save serialize/restore) and add one pure `world/*.ts` module each
(`loner.ts`, `needs.ts`) plus tests. They do **not** touch the same functions: the loner edits the
wander-decision block (lines ~1898–1917) and `recordGreet`/`recordTone`; needs edits the `forceStep`
tail (~1959–1968) and `eatFood`. Build them in either order; just don't clobber the shared
`spawnDino`/save blocks — add both fields in one pass.
